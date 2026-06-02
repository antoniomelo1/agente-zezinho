<script setup>
import { computed, onMounted, ref } from 'vue'
import { auth } from '../firebase/firebase.js'

const API_URL = import.meta.env.VITE_API_URL

const registros = ref([])
const oficinas = ref([])
const educadores = ref([])
const carregando = ref(false)
const carregandoFiltros = ref(false)
const erro = ref('')

const filtros = ref({
  oficinaId: '',
  uidEducador: '',
  dataInicio: '',
  dataFim: '',
  limite: '50'
})

const educadoresFiltrados = computed(() => {
  if (!filtros.value.oficinaId) {
    return educadores.value
  }

  return educadores.value.filter(
    (educador) => educador.oficinaId === filtros.value.oficinaId
  )
})

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    return ''
  }

  return usuario.getIdToken()
}

function textoCampo(valor, fallback = 'Não informado') {
  if (valor === null || valor === undefined) {
    return fallback
  }

  const texto = String(valor).trim()
  return texto || fallback
}

function textoOficina(registro) {
  if (registro.nomeOficina) {
    return registro.nomeOficina
  }

  const oficinaId = registro.oficinaId || ''
  const oficina = oficinas.value.find((item) => item.id === oficinaId)

  return oficina?.nome || textoCampo(oficinaId)
}

function limparFiltros() {
  filtros.value = {
    oficinaId: '',
    uidEducador: '',
    dataInicio: '',
    dataFim: '',
    limite: '50'
  }

  carregarAuditoria()
}

async function carregarFiltros() {
  carregandoFiltros.value = true

  try {
    const token = await obterToken()
    const [oficinasResponse, educadoresResponse] = await Promise.all([
      fetch(`${API_URL}/coordenador/oficinas`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }),
      fetch(`${API_URL}/usuarios/educadores`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    ])

    const oficinasData = await oficinasResponse.json().catch(() => ({}))
    const educadoresData = await educadoresResponse.json().catch(() => ({}))

    oficinas.value = oficinasResponse.ok && Array.isArray(oficinasData.oficinas)
      ? oficinasData.oficinas
      : []
    educadores.value = educadoresResponse.ok && Array.isArray(educadoresData.educadores)
      ? educadoresData.educadores
      : []
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = 'Não foi possível carregar os filtros institucionais.'
  } finally {
    carregandoFiltros.value = false
  }
}

async function carregarAuditoria() {
  carregando.value = true
  erro.value = ''

  try {
    const token = await obterToken()
    const query = new URLSearchParams()

    Object.entries(filtros.value).forEach(([chave, valor]) => {
      if (valor) {
        query.set(chave, valor)
      }
    })

    const queryString = query.toString()
    const url = queryString
      ? `${API_URL}/registros-diarios/auditoria/invalidados?${queryString}`
      : `${API_URL}/registros-diarios/auditoria/invalidados`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      erro.value = 'Não foi possível carregar a auditoria institucional de registros.'
      registros.value = []
      return
    }

    registros.value = Array.isArray(data.registros) ? data.registros : []
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = 'Não foi possível carregar a auditoria institucional de registros.'
    registros.value = []
  } finally {
    carregando.value = false
  }
}

onMounted(async () => {
  await carregarFiltros()
  await carregarAuditoria()
})
</script>

<template>
  <section class="auditoria-registros">
    <header class="cabecalho">
      <router-link to="/painel-coordenador" class="voltar-painel">
        Voltar ao painel
      </router-link>

      <h2>Auditoria Institucional de Registros</h2>
      <p>
        Consulta somente leitura dos Registros Diários invalidados e preservados
        para histórico institucional.
      </p>
      <p class="texto-apoio">
        Esta área não edita registros, não reverte invalidações e não remove
        documentos. Os registros invalidados permanecem preservados para
        rastreabilidade institucional.
      </p>
    </header>

    <form class="painel filtros" @submit.prevent="carregarAuditoria">
      <label>
        Oficina
        <select v-model="filtros.oficinaId" :disabled="carregandoFiltros">
          <option value="">Todas as oficinas disponíveis</option>
          <option v-for="oficina in oficinas" :key="oficina.id" :value="oficina.id">
            {{ oficina.nome }}
          </option>
        </select>
      </label>

      <label>
        Educador
        <select v-model="filtros.uidEducador" :disabled="carregandoFiltros">
          <option value="">Todos os educadores disponíveis</option>
          <option
            v-for="educador in educadoresFiltrados"
            :key="educador.uid"
            :value="educador.uid"
          >
            {{ educador.nome || educador.email || educador.uid }}
          </option>
        </select>
      </label>

      <label>
        Data inicial
        <input v-model="filtros.dataInicio" type="date" />
      </label>

      <label>
        Data final
        <input v-model="filtros.dataFim" type="date" />
      </label>

      <label>
        Limite
        <select v-model="filtros.limite">
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </label>

      <div class="acoes-filtros">
        <button type="submit" :disabled="carregando">
          {{ carregando ? 'Consultando...' : 'Consultar auditoria' }}
        </button>
        <button type="button" class="secundario" :disabled="carregando" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </form>

    <p v-if="erro" class="erro">{{ erro }}</p>

    <section class="painel">
      <div class="lista-topo">
        <div>
          <h3>Registros invalidados</h3>
          <p>Histórico institucional de ações corretivas registradas.</p>
        </div>
      </div>

      <p v-if="carregando" class="estado-lista">
        Carregando registros invalidados...
      </p>

      <p v-else-if="!erro && registros.length === 0" class="estado-lista">
        Nenhum Registro Diário invalidado foi encontrado para os filtros selecionados.
      </p>

      <div v-else class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th>Data do Registro</th>
              <th>Oficina</th>
              <th>Educador</th>
              <th>Data da Invalidação</th>
              <th>Responsável pela Invalidação</th>
              <th>Motivo da Invalidação</th>
              <th>Status Institucional</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="registro in registros" :key="registro.id">
              <td data-label="Data do Registro">
                {{ textoCampo(registro.dataRegistroFormatada) }}
              </td>
              <td data-label="Oficina">
                {{ textoOficina(registro) }}
              </td>
              <td data-label="Educador">
                {{ textoCampo(registro.nomeEducador) }}
              </td>
              <td data-label="Data da Invalidação">
                {{ textoCampo(registro.excluidoEmFormatado) }}
              </td>
              <td data-label="Responsável pela Invalidação">
                {{ textoCampo(registro.nomeExcluidoPor) }}
              </td>
              <td data-label="Motivo da Invalidação" class="motivo">
                {{ textoCampo(registro.motivoExclusao) }}
              </td>
              <td data-label="Status Institucional">
                <span class="status">Invalidado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.auditoria-registros {
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e2e8f0;
}

.cabecalho h2,
.painel h3 {
  margin: 0 0 6px;
  color: #f8fafc;
}

.cabecalho p,
.painel p,
.texto-apoio {
  margin: 0;
  color: #94a3b8;
  line-height: 1.5;
}

.voltar-painel {
  display: inline-flex;
  width: fit-content;
  margin-bottom: 14px;
  color: #00f2fe;
  text-decoration: none;
  font-weight: 700;
}

.voltar-painel:hover {
  text-decoration: underline;
}

.painel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.9);
}

.filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: end;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #cbd5e1;
  font-weight: 700;
}

input,
select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.55);
  color: #e2e8f0;
  font: inherit;
}

button {
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: #0f172a;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.secundario {
  background: #334155;
}

.acoes-filtros {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.erro {
  color: #fca5a5;
  font-weight: 700;
}

.estado-lista {
  color: #cbd5e1;
  font-weight: 700;
}

.lista-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.tabela-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  overflow: hidden;
}

th,
td {
  padding: 13px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  text-align: left;
  vertical-align: top;
}

th {
  background: rgba(51, 65, 85, 0.78);
  color: #dbe7f5;
  font-size: 0.82rem;
  text-transform: uppercase;
}

td {
  color: #e2e8f0;
  overflow-wrap: anywhere;
}

.motivo {
  min-width: 220px;
}

.status {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.14);
  font-size: 0.82rem;
  font-weight: 800;
}

@media (max-width: 760px) {
  .acoes-filtros {
    flex-direction: column;
  }

  table,
  thead,
  tbody,
  tr,
  th,
  td {
    display: block;
    width: 100%;
  }

  thead {
    display: none;
  }

  table {
    border: none;
    background: transparent;
  }

  tbody {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  tr {
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 14px;
    overflow: hidden;
    background: rgba(2, 6, 23, 0.42);
  }

  td {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 12px;
  }

  td::before {
    content: attr(data-label);
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }
}
</style>
