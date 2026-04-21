<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { auth } from '../firebase/firebase.js'

const API_URL = import.meta.env.VITE_API_URL

const nome = ref('')
const email = ref('')
const oficinaId = ref('programacao')
const carregando = ref(false)
const carregandoEducadores = ref(false)
const carregandoLeituraOperacional = ref(false)
const reenviando = ref(false)
const erro = ref('')
const erroLeituraOperacional = ref('')
const sucesso = ref('')
const linkPrimeiroAcesso = ref('')
const ultimoEducadorCriado = ref(null)
const educadores = ref([])
const leituraOperacional = ref({
  oficinas: [],
  educadores: [],
  historicoRegistros: []
})
const isEducadoresOpen = ref(false)
const selectedOficinaId = ref('')
const selectedEducadorId = ref('')
const selectedData = ref('')

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Usuário não autenticado.')
  }

  return await usuario.getIdToken()
}

async function criarEducador() {
  if (!nome.value || !email.value || !oficinaId.value) {
    erro.value = 'Informe nome, email e oficina.'
    sucesso.value = ''
    linkPrimeiroAcesso.value = ''
    return
  }

  erro.value = ''
  sucesso.value = ''
  linkPrimeiroAcesso.value = ''
  carregando.value = true

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/usuarios/educadores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome: nome.value,
        email: email.value,
        oficinaId: oficinaId.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao criar educador.'
      return
    }

    ultimoEducadorCriado.value = data.usuario || null
    linkPrimeiroAcesso.value = data.linkPrimeiroAcesso || ''
    sucesso.value =
      'Educador criado com sucesso. O link institucional de primeiro acesso foi gerado pelo backend.'

    await carregarEducadores()

    nome.value = ''
    email.value = ''
    oficinaId.value = 'programacao'
  } catch (error) {
    erro.value = error.message || 'Erro ao criar educador.'
  } finally {
    carregando.value = false
  }
}

async function carregarEducadores() {
  carregandoEducadores.value = true

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/usuarios/educadores`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao carregar educadores.')
    }

    educadores.value = Array.isArray(data.educadores) ? data.educadores : []
  } catch (error) {
    erro.value = error.message || 'Erro ao carregar educadores.'
  } finally {
    carregandoEducadores.value = false
  }
}

async function carregarLeituraOperacional() {
  carregandoLeituraOperacional.value = true
  erroLeituraOperacional.value = ''

  try {
    const token = await obterToken()
    const query = new URLSearchParams()

    if (selectedOficinaId.value && selectedEducadorId.value) {
      query.set('oficinaId', selectedOficinaId.value)
      query.set('educadorId', selectedEducadorId.value)

      if (selectedData.value) {
        query.set('data', selectedData.value)
      }
    }

    const queryString = query.toString()
    const url = queryString
      ? `${API_URL}/coordenador/leitura-operacional?${queryString}`
      : `${API_URL}/coordenador/leitura-operacional`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao carregar a visão da oficina.')
    }

    leituraOperacional.value = {
      oficinas: Array.isArray(data.oficinas) ? data.oficinas : [],
      educadores: Array.isArray(data.educadores) ? data.educadores : [],
      historicoRegistros: Array.isArray(data.historicoRegistros)
        ? data.historicoRegistros
        : []
    }
  } catch (error) {
    erroLeituraOperacional.value =
      error.message || 'Erro ao carregar a visão da oficina.'
  } finally {
    carregandoLeituraOperacional.value = false
  }
}

async function reenviarConvite(uid) {
  if (!uid) {
    erro.value = 'Nenhum educador pendente disponível para reenvio.'
    return
  }

  erro.value = ''
  sucesso.value = ''
  reenviando.value = true

  try {
    const token = await obterToken()

    const response = await fetch(
      `${API_URL}/coordenador/educadores/${uid}/reenviar-convite`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao reenviar convite.'
      return
    }

    ultimoEducadorCriado.value = data.usuario || null
    linkPrimeiroAcesso.value = data.linkPrimeiroAcesso || ''
    sucesso.value =
      'Novo link institucional de primeiro acesso gerado com sucesso.'
    await carregarEducadores()
  } catch (error) {
    erro.value = error.message || 'Erro ao reenviar convite.'
  } finally {
    reenviando.value = false
  }
}

function textoStatus(educador) {
  if (educador.ativo === true && educador.status === 'ativo') {
    return 'Ativo'
  }

  if (educador.status === 'pendente_ativacao') {
    return 'Pendente de ativação'
  }

  return educador.status || 'Indefinido'
}

function formatarDataRegistro(data) {
  if (!data) {
    return 'Sem registro'
  }

  const dataFormatada = new Date(`${data}T00:00:00`)
  return dataFormatada.toLocaleDateString('pt-BR')
}

function textoStatusAtualizacao(status) {
  if (status === 'atualizado') {
    return 'Atualizado'
  }

  if (status === 'atencao') {
    return 'Atenção'
  }

  if (status === 'sem_registro_recente') {
    return 'Sem atualização recente'
  }

  return 'Sem registro'
}

function textoOficina(oficinaId) {
  if (!oficinaId) {
    return 'Não informada'
  }

  if (oficinaId === 'programacao') {
    return 'Oficina de Programação'
  }

  return oficinaId
}

function textoPresenca(totalPresentes) {
  if (totalPresentes === null || totalPresentes === undefined || totalPresentes === '') {
    return '-'
  }

  return String(totalPresentes)
}

function textoPresencaPorPeriodo(educador) {
  const manha = educador?.totalPresentesManha
  const tarde = educador?.totalPresentesTarde
  const possuiManha = manha !== null && manha !== undefined && manha !== ''
  const possuiTarde = tarde !== null && tarde !== undefined && tarde !== ''

  if (possuiManha || possuiTarde) {
    return `M: ${possuiManha ? manha : '-'} | T: ${possuiTarde ? tarde : '-'}`
  }

  return textoPresenca(educador?.totalPresentes)
}

function textoResumos(registro) {
  const blocos = []

  if (registro?.resumoManha) {
    blocos.push(`Manha: ${registro.resumoManha}`)
  }

  if (registro?.resumoTarde) {
    blocos.push(`Tarde: ${registro.resumoTarde}`)
  }

  return blocos.join(' | ') || 'Sem resumo registrado'
}

function textoCampo(value, fallback = 'Não informado') {
  if (value === null || value === undefined) {
    return fallback
  }

  const texto = String(value).trim()
  return texto || fallback
}

const educadoresDisponiveis = computed(() => {
  if (!selectedOficinaId.value) {
    return []
  }

  return leituraOperacional.value.educadores
    .filter((educador) => educador.oficinaId === selectedOficinaId.value)
    .sort((a, b) =>
      String(a.nomeEducador || '').localeCompare(String(b.nomeEducador || ''), 'pt-BR')
    )
})

const isDetalhamentoAtivo = computed(
  () => Boolean(selectedOficinaId.value && selectedEducadorId.value)
)

const oficinasFiltradas = computed(() => {
  if (!selectedOficinaId.value) {
    return leituraOperacional.value.oficinas
  }

  return leituraOperacional.value.oficinas.filter(
    (oficina) => oficina.oficinaId === selectedOficinaId.value
  )
})

const educadoresFiltrados = computed(() => {
  const educadoresBase = selectedOficinaId.value
    ? leituraOperacional.value.educadores.filter(
        (educador) => educador.oficinaId === selectedOficinaId.value
      )
    : leituraOperacional.value.educadores

  if (!selectedEducadorId.value) {
    return educadoresBase
  }

  return educadoresBase.filter(
    (educador) => educador.uidEducador === selectedEducadorId.value
  )
})

watch(selectedOficinaId, (novaOficinaId) => {
  if (!novaOficinaId) {
    selectedEducadorId.value = ''
    selectedData.value = ''
    return
  }

  const educadorPertenceAOficina = educadoresDisponiveis.value.some(
    (educador) => educador.uidEducador === selectedEducadorId.value
  )

  if (!educadorPertenceAOficina) {
    selectedEducadorId.value = ''
  }
})

watch(selectedEducadorId, (novoEducadorId) => {
  if (!novoEducadorId) {
    selectedData.value = ''
  }
})

watch([selectedOficinaId, selectedEducadorId, selectedData], () => {
  carregarLeituraOperacional()
})

onMounted(() => {
  carregarEducadores()
  carregarLeituraOperacional()
})
</script>

<template>
  <div class="painel-container">
    <section class="cabecalho">
      <h2>Painel do Coordenador</h2>
      <p class="cabecalho-texto">
        Gestão institucional de educadores e leitura operacional das oficinas
      </p>
    </section>

    <div class="painel-grid">
      <section class="card card-formulario">
        <div class="bloco-titulo">
          <h3 class="card-titulo">Novo educador</h3>
          <span class="listagem-subtexto">
            Criação institucional com link seguro de primeiro acesso
          </span>
        </div>

        <input v-model="nome" type="text" placeholder="Nome completo" />
        <input v-model="email" type="email" placeholder="Email institucional" />

        <select v-model="oficinaId">
          <option value="programacao">Oficina de Programação</option>
        </select>

        <button @click="criarEducador" :disabled="carregando">
          {{ carregando ? 'Criando...' : 'Criar educador' }}
        </button>

        <button
          v-if="ultimoEducadorCriado?.uid"
          class="secundario"
          @click="reenviarConvite(ultimoEducadorCriado.uid)"
          :disabled="reenviando"
        >
          {{ reenviando ? 'Gerando novo link...' : 'Reenviar convite do último educador' }}
        </button>

        <p v-if="erro" class="erro">{{ erro }}</p>
        <p v-if="sucesso" class="sucesso">{{ sucesso }}</p>

        <div v-if="linkPrimeiroAcesso" class="link-box">
          <p>Link institucional de primeiro acesso:</p>
          <textarea readonly :value="linkPrimeiroAcesso"></textarea>
        </div>
      </section>

      <section class="card card-listagem card-listagem-secundaria">
        <button class="listagem-toggle" @click="isEducadoresOpen = !isEducadoresOpen">
          <span class="listagem-titulo-wrap">
            <h3 class="card-titulo">Educadores cadastrados ({{ educadores.length }})</h3>
            <span class="listagem-subtexto">
              {{ isEducadoresOpen ? 'Ocultar lista institucional' : 'Ver lista institucional' }}
            </span>
          </span>

          <span class="listagem-indicador">
            {{ isEducadoresOpen ? '-' : '+' }}
          </span>
        </button>

        <div v-if="isEducadoresOpen" class="listagem-conteudo">
          <p v-if="carregandoEducadores" class="estado-listagem">Carregando educadores...</p>
          <p v-else-if="educadores.length === 0" class="estado-listagem">
            Nenhum educador cadastrado ate o momento.
          </p>

          <div v-else class="tabela-scroll">
            <table class="tabela-educadores">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Oficina</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="educador in educadores" :key="educador.uid">
                  <td data-label="Nome" class="celula-textual celula-educador-lista">
                    {{ educador.nome }}
                  </td>
                  <td data-label="Email" class="celula-textual celula-email">
                    {{ educador.email }}
                  </td>
                  <td data-label="Oficina" class="celula-textual">
                    {{ textoOficina(educador.oficinaId) }}
                  </td>
                  <td
                    data-label="Status"
                    :class="
                      educador.status === 'ativo'
                        ? 'status-celula status-badge status-ativo celula-status'
                        : 'status-celula status-badge status-pendente celula-status'
                    "
                  >
                    {{ textoStatus(educador) }}
                  </td>
                  <td data-label="Ações" class="celula-acoes">
                    <button
                      v-if="educador.status === 'pendente_ativacao'"
                      class="secundario"
                      @click="reenviarConvite(educador.uid)"
                      :disabled="reenviando"
                    >
                      {{ reenviando ? 'Reenviando...' : 'Reenviar acesso' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <section class="card card-listagem card-destaque-operacional">
      <div class="bloco-titulo">
        <h3 class="card-titulo">Visão da Oficina</h3>
        <span class="listagem-subtexto">
          Leitura operacional por oficina e educador, com foco em atualização e acompanhamento
        </span>
      </div>

      <p v-if="carregandoLeituraOperacional" class="estado-listagem">
        Carregando visão da oficina...
      </p>

      <p v-else-if="erroLeituraOperacional" class="erro">
        {{ erroLeituraOperacional }}
      </p>

      <div
        v-else-if="
          leituraOperacional.oficinas.length === 0 &&
          leituraOperacional.educadores.length === 0
        "
        class="estado-listagem"
      >
        Nenhuma leitura operacional disponível no momento.
      </div>

      <template v-else>
        <div class="filtros-operacionais">
          <label class="filtro-campo">
            <span>Oficina</span>
            <select v-model="selectedOficinaId">
              <option value="">Todas as oficinas</option>
              <option
                v-for="oficina in leituraOperacional.oficinas"
                :key="oficina.oficinaId"
                :value="oficina.oficinaId"
              >
                {{ textoOficina(oficina.oficinaId) }}
              </option>
            </select>
          </label>

          <label class="filtro-campo">
            <span>Educador</span>
            <select
              v-model="selectedEducadorId"
              :disabled="!selectedOficinaId || educadoresDisponiveis.length === 0"
            >
              <option value="">Todos os educadores</option>
              <option
                v-for="educador in educadoresDisponiveis"
                :key="educador.uidEducador"
                :value="educador.uidEducador"
              >
                {{ textoCampo(educador.nomeEducador) }}
              </option>
            </select>
          </label>

          <label class="filtro-campo">
            <span>Data específica</span>
            <input
              v-model="selectedData"
              type="date"
              :disabled="!isDetalhamentoAtivo"
            />
          </label>
        </div>

        <div class="resumo-oficinas">
          <article
            v-for="oficina in oficinasFiltradas"
            :key="oficina.oficinaId"
            class="card-resumo-oficina"
          >
            <div class="linha-resumo linha-resumo-topo">
              <div class="resumo-oficina-identidade">
                <span class="resumo-oficina-label">Oficina</span>
                <strong>{{ textoOficina(oficina.oficinaId) }}</strong>
              </div>
              <span
                :class="[
                  'status-celula',
                  'status-badge',
                  oficina.statusAtualizacao === 'atualizado'
                    ? 'status-ativo'
                    : oficina.statusAtualizacao === 'atencao'
                      ? 'status-pendente'
                      : 'status-critico'
                ]"
              >
                {{ textoStatusAtualizacao(oficina.statusAtualizacao) }}
              </span>
            </div>

            <div class="resumo-metricas">
              <p><span>Última atualização</span><strong>{{ formatarDataRegistro(oficina.dataUltimoRegistro) }}</strong></p>
              <p><span>Educadores</span><strong>{{ oficina.totalEducadores }}</strong></p>
              <p><span>Com registro</span><strong>{{ oficina.educadoresComRegistro }}</strong></p>
            </div>
          </article>
        </div>

        <div class="tabela-scroll tabela-scroll-operacional">
          <table class="tabela-educadores tabela-operacional">
            <thead>
              <tr>
                <th>Educador</th>
                <th>Oficina</th>
                <th>Última aula</th>
                <th>Tema</th>
                <th>Tipo</th>
                <th>Presentes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="educador in educadoresFiltrados"
                :key="educador.uidEducador"
              >
                <td data-label="Educador" class="celula-educador celula-textual">
                  {{ textoCampo(educador.nomeEducador) }}
                </td>
                <td data-label="Oficina" class="celula-textual">
                  {{ textoOficina(educador.oficinaId) }}
                </td>
                <td data-label="Ultima aula" class="celula-data">
                  {{ formatarDataRegistro(educador.dataUltimoRegistro) }}
                </td>
                <td data-label="Tema" class="coluna-tema celula-textual">
                  <span class="texto-tema">
                    {{ textoCampo(educador.temaDia) }}
                  </span>
                </td>
                <td data-label="Tipo" class="celula-textual">
                  {{ textoCampo(educador.tipoAula) }}
                </td>
                <td data-label="Presentes" class="coluna-presenca">
                  {{ textoPresencaPorPeriodo(educador) }}
                </td>
                <td
                  data-label="Status"
                  :class="[
                    'status-celula',
                    'status-badge',
                    'celula-status',
                    educador.statusAtualizacao === 'atualizado'
                      ? 'status-ativo'
                      : educador.statusAtualizacao === 'atencao'
                        ? 'status-pendente'
                        : 'status-critico'
                  ]"
                >
                  {{ textoStatusAtualizacao(educador.statusAtualizacao) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section v-if="isDetalhamentoAtivo" class="historico-registros">
          <div class="bloco-titulo">
            <h4 class="card-titulo">Histórico recente do educador</h4>
            <span class="listagem-subtexto">
              {{ selectedData ? 'Registro encontrado para a data informada' : 'Últimos 3 registros mais recentes' }}
            </span>
          </div>

          <p
            v-if="leituraOperacional.historicoRegistros.length === 0"
            class="estado-listagem"
          >
            {{
              selectedData
                ? 'Nenhum registro encontrado para a data informada.'
                : 'Nenhum registro recente encontrado para este educador nesta oficina.'
            }}
          </p>

          <div v-else class="historico-lista">
            <article
              v-for="registro in leituraOperacional.historicoRegistros"
              :key="registro.id"
              class="historico-item"
            >
              <div class="historico-topo">
                <strong>{{ formatarDataRegistro(registro.dataRegistro) }}</strong>
                <span class="status-badge historico-tipo">
                  {{ textoCampo(registro.tipoAula) }}
                </span>
              </div>

              <p><span>Tema</span><strong>{{ textoCampo(registro.temaDia) }}</strong></p>
              <p><span>Módulo</span><strong>{{ textoCampo(registro.modulo) }}</strong></p>
              <p><span>Presentes</span><strong>{{ textoPresencaPorPeriodo(registro) }}</strong></p>
              <p><span>Resumo</span><strong>{{ textoResumos(registro) }}</strong></p>
            </article>
          </div>
        </section>
      </template>
    </section>
  </div>
</template>

<style scoped>
.painel-container {
  max-width: 1440px;
  margin: 24px auto 48px;
  padding: 0 28px;
  color: #e2e8f0;
}

.cabecalho {
  margin-bottom: 24px;
  padding: 0 4px;
}

.cabecalho h2 {
  margin: 0 0 6px;
  color: #f8fafc;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.cabecalho-texto {
  margin: 0;
  color: #94a3b8;
  font-size: 1rem;
  max-width: 780px;
}

.painel-grid {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1.16fr);
  gap: 22px;
  align-items: start;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 22px 48px rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(16px);
  color: #e2e8f0;
}

.card-formulario {
  position: sticky;
  top: 24px;
  gap: 13px;
  border-color: rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.82);
  box-shadow: 0 18px 38px rgba(2, 6, 23, 0.28);
}

.card + .card {
  margin-top: 18px;
}

.painel-grid .card + .card {
  margin-top: 0;
}

.card-titulo {
  margin: 0 0 4px;
  color: #f8fafc;
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.card-listagem {
  gap: 16px;
}

.card-listagem-secundaria {
  min-width: 0;
  border-color: rgba(0, 242, 254, 0.14);
  box-shadow: 0 24px 54px rgba(2, 6, 23, 0.34);
}

.card-destaque-operacional {
  margin-top: 18px;
  padding: 30px;
  border-color: rgba(0, 242, 254, 0.18);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.94)),
    rgba(15, 23, 42, 0.9);
}

.filtros-operacionais {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 280px));
  gap: 14px;
  align-items: end;
}

.filtro-campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  color: #cbd5e1;
  font-size: 0.8rem;
  font-weight: 600;
}

.filtro-campo span {
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.filtro-campo select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.listagem-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
}

.listagem-toggle:hover:not(:disabled) {
  transform: none;
}

.listagem-titulo-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bloco-titulo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.listagem-subtexto {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.45;
}

.listagem-indicador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(0, 242, 254, 0.25);
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.7);
  font-size: 1.2rem;
  line-height: 1;
}

.listagem-conteudo {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}

.estado-listagem {
  margin: 0;
  color: #cbd5e1;
}

input,
select,
textarea {
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  font: inherit;
  color: #e2e8f0;
  background: rgba(2, 6, 23, 0.55);
}

textarea {
  min-height: 120px;
  resize: vertical;
}

button {
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: #0f172a;
  color: #ffffff;
  font-weight: 600;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.secundario {
  background: #334155;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.erro {
  color: #b91c1c;
  font-weight: 600;
}

.sucesso {
  color: #166534;
  font-weight: 600;
}

.link-box {
  padding: 12px;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(0, 242, 254, 0.18);
  color: #e2e8f0;
}

.link-box p {
  margin: 0 0 8px;
  color: #cbd5e1;
}

.tabela-scroll {
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 16px;
  padding-right: 2px;
}

.tabela-scroll-operacional {
  max-height: 520px;
}

.resumo-oficinas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 18px;
}

.historico-registros {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(2, 6, 23, 0.34);
}

.historico-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.historico-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.78);
}

.historico-item p {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  color: #cbd5e1;
}

.historico-item span {
  color: #94a3b8;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.historico-item strong {
  color: #f8fafc;
  line-height: 1.45;
}

.historico-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.historico-tipo {
  color: #cbd5e1;
}

.card-resumo-oficina {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.5));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.linha-resumo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.linha-resumo-topo {
  align-items: flex-start;
}

.resumo-oficina-identidade {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.resumo-oficina-label {
  color: #94a3b8;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.resumo-oficina-identidade strong {
  font-size: 1.05rem;
  line-height: 1.35;
}

.resumo-metricas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.resumo-metricas p {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 14px;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.46);
  border: 1px solid rgba(148, 163, 184, 0.1);
  color: #cbd5e1;
}

.resumo-metricas span {
  color: #94a3b8;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.resumo-metricas strong {
  color: #f8fafc;
  font-size: 1.08rem;
  line-height: 1.2;
}

.tabela-educadores {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.42);
}

.tabela-educadores th,
.tabela-educadores td {
  padding: 15px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  text-align: left;
  vertical-align: top;
}

.tabela-educadores th {
  background: rgba(51, 65, 85, 0.78);
  color: #dbe7f5;
  font-weight: 700;
  font-size: 0.84rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 1;
}

.tabela-educadores td {
  color: #e2e8f0;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}

.tabela-educadores tbody tr:nth-child(even) {
  background: rgba(15, 23, 42, 0.28);
}

.tabela-educadores tbody tr:hover {
  background: rgba(30, 41, 59, 0.72);
}

.tabela-educadores tbody td:first-child {
  color: #f8fafc;
  font-weight: 600;
}

.tabela-educadores tbody td:nth-child(2),
.tabela-educadores tbody td:nth-child(3) {
  color: #cbd5e1;
}

.celula-educador {
  width: 16%;
}

.celula-educador-lista {
  width: 23%;
}

.celula-email {
  width: 30%;
}

.coluna-tema {
  width: 33%;
}

.texto-tema {
  display: block;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: #e2e8f0;
  line-height: 1.55;
}

.coluna-presenca {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.celula-textual {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.celula-data {
  white-space: normal;
}

.celula-status {
  white-space: normal;
}

.celula-acoes {
  width: 14%;
}

.celula-acoes button {
  width: 100%;
}

.status-celula {
  font-weight: 700;
  letter-spacing: 0.01em;
  position: relative;
}

.status-celula::before {
  content: '';
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 8px;
  border-radius: 999px;
  vertical-align: middle;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.04);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  width: fit-content;
  max-width: 100%;
  padding: 7px 11px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.62);
  font-size: 0.82rem;
  line-height: 1.25;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.status-ativo {
  color: #4ade80;
}

.status-ativo::before {
  background: #16a34a;
}

.status-pendente {
  color: #fbbf24;
}

.status-pendente::before {
  background: #f59e0b;
}

.status-critico {
  color: #f87171;
}

.status-critico::before {
  background: #dc2626;
}

.tabela-educadores td button {
  background: rgba(15, 23, 42, 0.96);
  color: #ffffff;
  border: 1px solid rgba(0, 242, 254, 0.35);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.tabela-educadores td button:hover:not(:disabled) {
  background: #1e293b;
  border-color: rgba(0, 242, 254, 0.7);
}

.tabela-educadores td button:disabled {
  background: #94a3b8;
  border-color: #94a3b8;
  color: #f8fafc;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .painel-container {
    padding: 0 16px;
  }

  .painel-grid {
    grid-template-columns: 1fr;
  }

  .card-formulario {
    position: static;
  }

  .linha-resumo {
    align-items: flex-start;
    flex-direction: column;
  }

  .resumo-metricas {
    grid-template-columns: 1fr;
  }

  .card-destaque-operacional {
    padding: 22px;
  }

  .filtros-operacionais {
    grid-template-columns: 1fr;
  }

  .status-badge {
    width: auto;
  }

  .tabela-scroll,
  .tabela-scroll-operacional {
    max-height: none;
    overflow: visible;
  }

  .tabela-educadores,
  .tabela-educadores thead,
  .tabela-educadores tbody,
  .tabela-educadores tr,
  .tabela-educadores th,
  .tabela-educadores td {
    display: block;
    width: 100%;
  }

  .tabela-educadores thead {
    display: none;
  }

  .tabela-educadores {
    border: none;
    background: transparent;
  }

  .tabela-educadores tbody {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tabela-educadores tbody tr {
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    overflow: hidden;
    background: rgba(2, 6, 23, 0.42);
  }

  .tabela-educadores tbody tr:nth-child(even) {
    background: rgba(2, 6, 23, 0.42);
  }

  .tabela-educadores td {
    display: grid;
    grid-template-columns: minmax(96px, 120px) minmax(0, 1fr);
    gap: 12px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    align-items: start;
  }

  .tabela-educadores td::before {
    content: attr(data-label);
    color: #94a3b8;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .tabela-educadores td:last-child {
    border-bottom: none;
  }

  .coluna-presenca {
    text-align: left;
  }

  .celula-acoes,
  .celula-educador,
  .celula-educador-lista,
  .celula-email,
  .coluna-tema {
    width: auto;
  }

  .celula-acoes button {
    width: auto;
  }
}
</style>
