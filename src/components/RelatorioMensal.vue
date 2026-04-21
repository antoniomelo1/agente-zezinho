<script setup>
import { ref } from 'vue'
import { auth } from '../firebase/firebase.js'

const API_URL = import.meta.env.VITE_API_URL

const mes = ref('')
const ano = ref('')
const carregando = ref(false)
const relatorio = ref(null)
const erro = ref('')

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Usuário não autenticado.')
  }

  return await usuario.getIdToken()
}

async function gerarRelatorio() {
  if (!mes.value || !ano.value) {
    erro.value = 'Informe mês e ano.'
    return
  }

  erro.value = ''
  carregando.value = true
  relatorio.value = null

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/gerar-relatorio-mensal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        mes: Number(mes.value),
        ano: Number(ano.value)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao gerar relatório.'
      return
    }

    if (data.erro) {
      erro.value = data.erro
      return
    }

    relatorio.value = data
  } catch (e) {
    erro.value = e.message || 'Erro ao gerar relatório.'
    console.error(e)
  } finally {
    carregando.value = false
  }
}

async function exportarDocx() {
  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/exportar-relatorio-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(relatorio.value)
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      erro.value = data?.erro || 'Erro ao exportar DOCX.'
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'Relatorio_Execucao_Mensal.docx'
    link.click()

    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
    erro.value = e.message || 'Erro ao exportar DOCX.'
  }
}
</script>

<template>
  <main class="relatorio-container">
    <section class="controle">
      <select v-model="mes">
        <option value="">Mês</option>
        <option value="1">Janeiro</option>
        <option value="2">Fevereiro</option>
        <option value="3">Março</option>
        <option value="4">Abril</option>
        <option value="5">Maio</option>
        <option value="6">Junho</option>
        <option value="7">Julho</option>
        <option value="8">Agosto</option>
        <option value="9">Setembro</option>
        <option value="10">Outubro</option>
        <option value="11">Novembro</option>
        <option value="12">Dezembro</option>
      </select>

      <input v-model="ano" type="number" placeholder="Ano" />

      <button :disabled="carregando" @click="gerarRelatorio">
        {{ carregando ? 'Gerando...' : 'Gerar relatório' }}
      </button>
    </section>

    <button
      v-if="relatorio"
      class="btn-exportar"
      @click="exportarDocx"
    >
      Exportar DOCX
    </button>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <section v-if="relatorio" class="documento">
      <header class="relatorio-header">
        <h1>{{ relatorio.cabecalho.titulo }}</h1>
        <p>
          Oficina de Programação - {{ relatorio.cabecalho.mes }}/{{ relatorio.cabecalho.ano }}
        </p>
      </header>

      <section class="bloco">
        <h2>Defesa do Projeto Aplicado</h2>
        <p
          v-for="(paragrafo, i) in relatorio.cabecalho.defesaProjetoAplicado.split('\n\n')"
          :key="i"
        >
          {{ paragrafo }}
        </p>
      </section>

      <section
        v-for="(semana, s) in relatorio.semanas"
        :key="s"
        class="bloco"
      >
        <h2>{{ semana.identificador }} - {{ semana.periodo }}</h2>

        <article
          v-for="(dia, d) in semana.dias"
          :key="d"
          class="dia"
        >
          <h3>Data: {{ dia.dataFormatada }}</h3>

          <ul class="meta-dia">
            <li><strong>Módulo:</strong> {{ dia.modulo }}</li>
            <li><strong>Tema da manhã:</strong> {{ dia.temaDiaManha }}</li>
            <li><strong>Tema da tarde:</strong> {{ dia.temaDiaTarde }}</li>
            <li><strong>Tema consolidado do dia:</strong> {{ dia.temaDia }}</li>
            <li><strong>Tema anterior:</strong> {{ dia.temaAnterior }}</li>
            <li><strong>Soft Skills desenvolvidas:</strong> {{ dia.softSkillsDesenvolvidas }}</li>
          </ul>

          <div class="bloco-tabela">
            <table class="tabela">
              <thead>
                <tr>
                  <th scope="col">Atividades Realizadas</th>
                  <th scope="col">Resultados</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(linha, i) in dia.tabelaDiaria" :key="i">
                  <td v-text="linha.atividade"></td>
                  <td v-text="linha.resultado"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <section class="bloco-fotos">
            <h4>Registros fotográficos</h4>
            <div class="galeria-fotos">
              <div class="foto-placeholder">Inserir foto</div>
              <div class="foto-placeholder">Inserir foto</div>
              <div class="foto-placeholder">Inserir foto</div>
            </div>
          </section>
        </article>

        <article class="fechamento">
          <h3 class="titulo-parecer">Parecer técnico do educador</h3>
          <p>{{ semana.parecerTecnico }}</p>
        </article>

        <div class="divisor-semana"></div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.relatorio-container {
  margin: 0 auto;
  padding: 32px 20px;
  color: #0f172a;
}

.controle {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.controle select,
.controle input {
  height: 42px;
  padding: 0 12px;
  font-size: 0.9rem;
  border-radius: 10px;
  border: 1px solid #334155;
  background: rgba(15, 23, 42, 0.8);
  color: #ffffff;
  flex: 1;
  box-sizing: border-box;
}

.controle button {
  height: 42px;
  padding: 0 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%);
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.controle button:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .controle {
    flex-direction: column;
    align-items: stretch;
  }

  .controle select,
  .controle input,
  .controle button {
    width: 100%;
    height: 42px;
  }
}

.documento {
  background: #ffffff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  line-height: 1.5;
}

.documento p,
.documento li,
.documento td,
.documento th {
  line-height: 1.5;
}

.relatorio-header h1 {
  margin-bottom: 8px;
}

.bloco {
  margin-top: 32px;
}

.dia {
  margin-top: 24px;
}

.meta-dia {
  margin: 12px 0;
  padding-left: 16px;
}

.meta-dia li {
  margin-bottom: 6px;
}

.bloco-tabela {
  margin-top: 12px;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}

.tabela th,
.tabela td {
  border: 1px solid #cbd5e1;
  padding: 10px;
  text-align: left;
}

.tabela th {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}

@media (max-width: 600px) {
  .tabela {
    display: block;
    overflow-x: auto;
  }
}

.fechamento {
  margin-top: 32px;
  padding-top: 8px;
}

.titulo-parecer {
  margin-bottom: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.divisor-semana {
  margin-top: 40px;
  border-bottom: 2px solid #334155;
}

.bloco-fotos {
  margin-top: 20px;
}

.galeria-fotos {
  display: flex;
  gap: 16px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.foto-placeholder {
  flex: 1;
  min-width: 180px;
  height: 150px;
  border: 2px dashed #94a3b8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: #64748b;
  background: #f8fafc;
}

@media (max-width: 600px) {
  .foto-placeholder {
    min-width: 100%;
  }
}

.btn-exportar {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  color: #ffffff;
  border: 1px solid #334155;
  padding: 10px 18px;
  border-radius: 10px;
  margin-bottom: 17px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-exportar:hover {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
}

.erro {
  color: #b91c1c;
  margin-top: 12px;
}
</style>
