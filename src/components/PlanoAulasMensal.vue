<script setup>
import { computed, ref } from 'vue'
import { auth } from '../firebase/firebase.js'

const API_URL = import.meta.env.VITE_API_URL

const mes = ref('')
const ano = ref('')
const observacoesMes = ref('')
const modulosPrevistosTexto = ref('')
const carregando = ref(false)
const plano = ref(null)
const erro = ref('')

const importanciaProjetoMesParagrafos = computed(() => {
  return String(plano.value?.importanciaProjetoMes || '')
    .split(/\n\s*\n|\r?\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean)
})

function obterSemestrePorMes(mesAtual) {
  const numeroMes = Number(mesAtual)
  return numeroMes >= 1 && numeroMes <= 6 ? '1o semestre' : '2o semestre'
}

function formatarErroPlanoMensal(mensagem) {
  if (typeof mensagem !== 'string' || !mensagem.trim()) {
    return 'Erro ao gerar plano mensal.'
  }

  if (mensagem.startsWith('Nenhum documento base ativo foi encontrado para ')) {
      return `${mensagem} Acesse a Base Institucional e confirme se há uma versão ativa do Documento Base do Plano Mensal para esse período.`
  }

  return mensagem
}

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Usuário não autenticado.')
  }

  return usuario.getIdToken()
}

function normalizarModulosPrevistos() {
  return modulosPrevistosTexto.value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

async function gerarPlano() {
  if (!mes.value || !ano.value) {
    erro.value = 'Informe mês e ano.'
    return
  }

  erro.value = ''
  carregando.value = true
  plano.value = null

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/gerar-plano-aulas-mensal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        mes: Number(mes.value),
        ano: Number(ano.value),
        observacoesMes: observacoesMes.value,
        modulosPrevistos: normalizarModulosPrevistos()
      })
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = formatarErroPlanoMensal(data.erro)
      return
    }

    plano.value = data
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = formatarErroPlanoMensal(errorAtual.message)
  } finally {
    carregando.value = false
  }
}

async function exportarDocx() {
  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/exportar-plano-aulas-mensal-docx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(plano.value)
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
    link.download = 'Plano_Aulas_Mensal.docx'
    link.click()

    window.URL.revokeObjectURL(url)
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Erro ao exportar DOCX.'
  }
}
</script>

<template>
  <main class="plano-container">
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

      <button :disabled="carregando" @click="gerarPlano">
        <span v-if="carregando" class="spinner-botao" aria-hidden="true"></span>
        <span>{{ carregando ? 'Gerando plano...' : 'Gerar plano mensal' }}</span>
      </button>
    </section>

    <p class="texto-apoio">
      A geração utilizará a versão ativa do Documento Base do Plano Mensal para
      {{ ano || 'o ano selecionado' }} - {{ obterSemestrePorMes(mes) }}.
    </p>

    <section class="bloco-formulario">
      <label>
        Observações do mês
        <textarea
          v-model="observacoesMes"
          rows="4"
          placeholder="Ajustes opcionais do educador para o mês"
        ></textarea>
      </label>

      <label>
        Módulos previstos
        <textarea
          v-model="modulosPrevistosTexto"
          rows="4"
          placeholder="Informe um módulo por linha ou separado por vírgulas"
        ></textarea>
      </label>
    </section>

    <button
      v-if="plano"
      class="btn-exportar"
      @click="exportarDocx"
    >
      Exportar DOCX
    </button>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <section v-if="plano" class="documento">
      <header class="documento-header">
        <h1>{{ plano.cabecalho.titulo }}</h1>
        <p>{{ plano.cabecalho.oficina }} - {{ plano.cabecalho.mes }}/{{ plano.cabecalho.ano }}</p>
        <p>Educador: {{ plano.cabecalho.educador }}</p>
        <p>Eixo da pedagogia: {{ plano.cabecalho.eixoPedagogia }}</p>
        <p>Projeto do mês: {{ plano.cabecalho.projetoMes }}</p>
      </header>

      <section class="bloco">
        <h2>Importância do projeto no mês</h2>
        <p
          v-for="(paragrafo, indiceParagrafo) in importanciaProjetoMesParagrafos"
          :key="indiceParagrafo"
        >
          {{ paragrafo }}
        </p>
      </section>

      <section
        v-for="(semana, indiceSemana) in plano.semanas"
        :key="indiceSemana"
        class="bloco"
      >
        <h2>{{ semana.identificacao }} - {{ semana.periodo }}</h2>
        <p><strong>Áreas do conhecimento:</strong> {{ semana.areasConhecimento.join(', ') }}</p>

        <article
          v-for="(dia, indiceDia) in semana.dias"
          :key="`${indiceSemana}-${indiceDia}`"
          class="dia"
        >
          <h3>{{ dia.data }} - {{ dia.nomeAtividade }}</h3>

          <div class="subbloco">
            <strong>Objetivos específicos</strong>
            <ul>
              <li v-for="(objetivo, indiceObjetivo) in dia.objetivosEspecificos" :key="indiceObjetivo">
                {{ objetivo }}
              </li>
            </ul>
          </div>

          <div class="subbloco">
            <strong>Apresentação</strong>
            <p>{{ dia.apresentacao }}</p>
          </div>

          <div class="subbloco">
            <strong>Desenvolvimento</strong>
            <p>{{ dia.desenvolvimento }}</p>
          </div>

          <div class="subbloco">
            <strong>Fechamento</strong>
            <p>{{ dia.fechamento }}</p>
          </div>
        </article>
      </section>

      <section class="bloco">
        <h2>Recursos do mês</h2>
        <ul>
          <li v-for="(recurso, indiceRecurso) in plano.recursosMes" :key="indiceRecurso">
            {{ recurso }}
          </li>
        </ul>
      </section>
    </section>
  </main>
</template>

<style scoped>
.plano-container {
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

.controle button,
.btn-exportar {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.controle button {
  min-width: 176px;
}

.controle button:disabled {
  cursor: not-allowed;
  opacity: 0.82;
}

.spinner-botao {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.55);
  border-top-color: transparent;
  border-radius: 50%;
  flex: 0 0 auto;
  animation: girar-spinner 0.8s linear infinite;
}

@keyframes girar-spinner {
  to {
    transform: rotate(360deg);
  }
}

.bloco-formulario {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.texto-apoio {
  margin: -6px 0 20px;
  color: #334155;
  line-height: 1.5;
}

.bloco-formulario label {
  display: grid;
  gap: 8px;
  color: #e2e8f0;
}

.bloco-formulario textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.55);
  color: #e2e8f0;
  padding: 12px;
  resize: vertical;
}

.documento {
  background: #ffffff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  line-height: 1.55;
}

.documento-header p {
  margin: 4px 0;
}

.bloco {
  margin-top: 28px;
}

.dia {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.subbloco {
  margin-top: 12px;
}

.subbloco ul {
  padding-left: 20px;
}

.erro {
  color: #b91c1c;
  margin-top: 12px;
}

@media (max-width: 700px) {
  .controle {
    flex-direction: column;
    align-items: stretch;
  }

  .controle button,
  .btn-exportar,
  .controle select,
  .controle input {
    width: 100%;
  }

  .documento {
    padding: 20px;
  }
}
</style>
