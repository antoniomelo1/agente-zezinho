<script setup>
import { ref } from 'vue'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

// ===== ESTADO =====
const mes = ref('')
const ano = ref('')
const carregando = ref(false)

const relatorio = ref('')
const defesaProjeto = ref('')
const carregandoDefesa = ref(false)

// ===== GERAR DEFESA DO PROJETO (IA - BACKEND) =====
async function gerarDefesaProjeto(defesaPlanoAnual, registrosMensaisTexto) {
  carregandoDefesa.value = true
  defesaProjeto.value = ''

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/gerar-defesa-projeto`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defesaPlanoAnual,
          registrosMensais: registrosMensaisTexto
        })
      }
    )

    const data = await response.json()
    defesaProjeto.value = data.defesa || ''
  } catch (error) {
    console.error(error)
    defesaProjeto.value = 'Erro ao gerar a Defesa do Projeto Aplicado.'
  } finally {
    carregandoDefesa.value = false
  }
}

// ===== GERAR RELATÓRIO =====
async function gerarRelatorio() {
  if (!mes.value || !ano.value) {
    alert('Selecione mês e ano')
    return
  }

  carregando.value = true
  relatorio.value = ''
  defesaProjeto.value = ''

  try {
    // ===== BUSCAR REGISTROS =====
    const snapshot = await getDocs(collection(db, 'registros_diarios'))

  const registrosDoMes = snapshot.docs
    .map(d => d.data())
    .filter(registro => {
      if (!registro) return false
      if (!registro.data) return false

      // Normaliza a data do Firestore para string YYYY-MM-DD
      let dataString = ''

      if (typeof registro.data === 'string') {
        dataString = registro.data
      } else if (registro.data.toDate) {
        dataString = registro.data.toDate().toISOString().slice(0, 10)
      }

      const prefixo = `${ano.value}-${mes.value}`
      return dataString.startsWith(prefixo)
    })



    if (registrosDoMes.length === 0) {
      relatorio.value = 'Nenhum registro encontrado para este período.'
      return
    }

    // ===== BUSCAR PLANO ANUAL =====
    const planoRef = doc(db, 'plano_anual', ano.value)
    const planoSnap = await getDoc(planoRef)
    const defesaPlanoAnual =
      planoSnap.exists() ? planoSnap.data().defesaProjetoAplicado : ''

    // ===== TEXTO BASE PARA IA =====
    const registrosMensaisTexto = registrosDoMes
      .map(r => `
Data: ${r.data}
Tema: ${r.temaDia || 'Não informado'}
Manhã: ${r.resumoManha || '—'}
Tarde: ${r.resumoTarde || '—'}
Soft Skills Oriente: ${r.softOriente || '—'}
Soft Skills Coração: ${r.softCoracao || '—'}
Observações: ${r.observacoes || '—'}
`)
      .join('\n')

    // ===== CHAMAR IA (DEFESA) =====
    await gerarDefesaProjeto(defesaPlanoAnual, registrosMensaisTexto)

    // ===== MONTAGEM DO RELATÓRIO =====
    let texto = `RELATÓRIO DE EXECUÇÃO MENSAL\n\n`
    texto += `Mês/Ano: ${mes.value}/${ano.value}\n`
    texto += `Total de dias registrados: ${registrosDoMes.length}\n\n`

    registrosDoMes.forEach((r, index) => {
      texto += `Dia ${index + 1} – ${r.data}\n`
      texto += `Tema do dia: ${r.temaDia || 'Não informado'}\n`
      texto += `Tipo de aula: ${r.tipoAula || 'Não informado'}\n\n`

      if (r.resumoManha) {
        texto += `Manhã:\n${r.resumoManha}\n\n`
      }

      if (r.resumoTarde) {
        texto += `Tarde:\n${r.resumoTarde}\n\n`
      }

      texto += `Soft Skills – Oriente:\n${r.softOriente || 'Não registrado'}\n\n`
      texto += `Soft Skills – Coração:\n${r.softCoracao || 'Não registrado'}\n\n`
      texto += `Observações:\n${r.observacoes || 'Nenhuma'}\n`
      texto += `----------------------------------------\n\n`
    })

    relatorio.value = texto

} catch (error) {
  console.error('ERRO REAL:', error)
  relatorio.value = error.message || 'Erro desconhecido'
} finally {
    carregando.value = false
  }
}

function copiarRelatorio() {
  const textoFinal = `
DEFESA DO PROJETO APLICADO

${defesaProjeto}

----------------------------------------

${relatorio.value}
`
  navigator.clipboard.writeText(textoFinal)
  alert('Relatório copiado')
}
</script>

<template>
  <section class="relatorio-container">

    <header>
      <h2>Relatório de Execução Mensal</h2>
      <p>Gerado automaticamente a partir dos registros diários</p>
    </header>

    <div class="filtros">
      <select v-model="mes">
        <option value="">Mês</option>
        <option value="01">Janeiro</option>
        <option value="02">Fevereiro</option>
        <option value="03">Março</option>
        <option value="04">Abril</option>
        <option value="05">Maio</option>
        <option value="06">Junho</option>
        <option value="07">Julho</option>
        <option value="08">Agosto</option>
        <option value="09">Setembro</option>
        <option value="10">Outubro</option>
        <option value="11">Novembro</option>
        <option value="12">Dezembro</option>
      </select>

      <input type="text" placeholder="Ano" v-model="ano" />

      <button @click="gerarRelatorio" :disabled="carregando">
        {{ carregando ? 'Gerando...' : 'Gerar relatório' }}
      </button>
    </div>

    <!-- DEFESA DO PROJETO -->
    <section v-if="defesaProjeto" class="resultado">
      <h3>Defesa do Projeto Aplicado</h3>
      <p v-if="carregandoDefesa">Gerando texto…</p>
      <pre v-else>{{ defesaProjeto }}</pre>
    </section>

    <!-- RELATÓRIO -->
    <section v-if="relatorio" class="resultado">
      <div class="acoes">
        <button @click="copiarRelatorio">Copiar relatório</button>
      </div>
      <pre>{{ relatorio }}</pre>
    </section>

  </section>
</template>

<style scoped>
.relatorio-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

header p {
  margin-top: 6px;
  color: #64748b;
}

.filtros {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

select,
input {
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #cbd5f5;
}

button {
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  cursor: pointer;
}

.resultado {
  background: #0f172a;
  color: #e5e7eb;
  padding: 30px;
  border-radius: 16px;
  margin-bottom: 30px;
}

.acoes {
  text-align: right;
  margin-bottom: 10px;
}

pre {
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>
