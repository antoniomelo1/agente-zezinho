<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { auth } from '../firebase/firebase.js'
import { useAuthStore } from '../stores/authStore'
import {
  isRoleCoordenadorPedagogico,
  isRoleGestorPedagogico
} from '../constants/roles'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore()

const oficinaId = ref('')
const dataSelecionada = ref('')
const datasAfetadas = ref([])
const motivoTipo = ref('feriado')
const descricao = ref('')
const escopo = ref('oficina')
const oficinasGestor = ref([])
const carregandoOficinas = ref(false)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')

const isCoordenadorPedagogico = computed(() =>
  isRoleCoordenadorPedagogico(authStore.role)
)

const isGestorPedagogico = computed(() =>
  isRoleGestorPedagogico(authStore.role)
)

const oficinasDisponiveis = computed(() => {
  if (isGestorPedagogico.value) {
    return oficinasGestor.value
  }

  if (isCoordenadorPedagogico.value) {
    return authStore.oficinasResponsaveis.map((id) => ({
      id,
      nome: textoOficina(id)
    }))
  }

  return []
})

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Usuário não autenticado.')
  }

  return usuario.getIdToken()
}

function textoOficina(id) {
  if (!id) {
    return 'Não informada'
  }

  if (id === 'programacao') {
    return 'Oficina de Programação'
  }

  return id
}

function formatarData(dataISO) {
  const data = new Date(`${dataISO}T00:00:00`)
  return data.toLocaleDateString('pt-BR')
}

function limparMensagens() {
  erro.value = ''
  sucesso.value = ''
}

function aplicarOficinaPadrao() {
  if (!oficinaId.value && oficinasDisponiveis.value.length === 1) {
    oficinaId.value = oficinasDisponiveis.value[0].id
  }
}

async function carregarOficinasGestor() {
  if (!isGestorPedagogico.value) {
    aplicarOficinaPadrao()
    return
  }

  carregandoOficinas.value = true

  try {
    const token = await obterToken()
    const response = await fetch(`${API_URL}/admin/oficinas`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao carregar oficinas institucionais.')
    }

    oficinasGestor.value = Array.isArray(data.oficinas) ? data.oficinas : []
    aplicarOficinaPadrao()
  } catch (error) {
    erro.value = error.message || 'Erro ao carregar oficinas institucionais.'
  } finally {
    carregandoOficinas.value = false
  }
}

function adicionarData() {
  limparMensagens()

  if (!dataSelecionada.value) {
    erro.value = 'Informe uma data para adicionar.'
    return
  }

  if (datasAfetadas.value.includes(dataSelecionada.value)) {
    erro.value = 'Esta data já foi adicionada.'
    return
  }

  datasAfetadas.value = [...datasAfetadas.value, dataSelecionada.value].sort()
  dataSelecionada.value = ''
}

function removerData(dataISO) {
  limparMensagens()
  datasAfetadas.value = datasAfetadas.value.filter((data) => data !== dataISO)
}

function validarFormulario() {
  if (!oficinaId.value.trim()) {
    return 'Informe a oficina.'
  }

  if (datasAfetadas.value.length === 0) {
    return 'Adicione ao menos uma data afetada.'
  }

  if (!motivoTipo.value) {
    return 'Informe o motivo da ocorrência.'
  }

  if (!descricao.value.trim()) {
    return 'Informe uma descrição institucional.'
  }

  if (!escopo.value) {
    return 'Informe o escopo da ocorrência.'
  }

  return ''
}

function limparFormulario() {
  dataSelecionada.value = ''
  datasAfetadas.value = []
  motivoTipo.value = 'feriado'
  descricao.value = ''
  escopo.value = 'oficina'
}

async function salvarOcorrencia() {
  limparMensagens()

  const mensagemValidacao = validarFormulario()

  if (mensagemValidacao) {
    erro.value = mensagemValidacao
    return
  }

  salvando.value = true

  try {
    const token = await obterToken()
    const payload = {
      oficinaId: oficinaId.value.trim(),
      datasAfetadas: datasAfetadas.value,
      motivoTipo: motivoTipo.value,
      descricao: descricao.value.trim(),
      escopo: escopo.value
    }

    const response = await fetch(`${API_URL}/ocorrencias-calendario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao salvar ocorrência de calendário.')
    }

    sucesso.value = data.mensagem || 'Ocorrência de calendário salva com sucesso.'
    limparFormulario()
    aplicarOficinaPadrao()
  } catch (error) {
    erro.value = error.message || 'Erro ao salvar ocorrência de calendário.'
  } finally {
    salvando.value = false
  }
}

onMounted(() => {
  carregarOficinasGestor()
})

watch(oficinasDisponiveis, () => {
  aplicarOficinaPadrao()
})
</script>

<template>
  <section class="ocorrencias-container">
    <header class="ocorrencias-header">
      <RouterLink class="voltar" to="/painel-coordenador">
        Voltar ao painel
      </RouterLink>
      <h2>Ocorrências de calendário</h2>
      <p>
        Cadastro institucional de datas sem atividade de oficina, sem tratar o dia como aula vazia.
      </p>
    </header>

    <form class="card formulario" @submit.prevent="salvarOcorrencia">
      <label>
        Oficina
        <select
          v-if="oficinasDisponiveis.length > 0"
          v-model="oficinaId"
          :disabled="carregandoOficinas || salvando"
        >
          <option value="">Selecione uma oficina</option>
          <option
            v-for="oficina in oficinasDisponiveis"
            :key="oficina.id"
            :value="oficina.id"
          >
            {{ oficina.nome }}
          </option>
        </select>
        <input
          v-else
          v-model="oficinaId"
          type="text"
          placeholder="Ex: programacao"
          :disabled="carregandoOficinas || salvando"
        />
      </label>

      <div class="grid">
        <label>
          Motivo
          <select v-model="motivoTipo" :disabled="salvando">
            <option value="feriado">Feriado</option>
            <option value="suspensao">Suspensão de atividades</option>
            <option value="reuniao_pedagogica">Reunião pedagógica</option>
            <option value="evento_institucional">Evento institucional</option>
            <option value="outro">Outro</option>
          </select>
        </label>

        <label>
          Escopo
          <select v-model="escopo" :disabled="salvando">
            <option value="oficina">Oficina</option>
            <option value="institucional">Institucional</option>
          </select>
        </label>
      </div>

      <div class="datas-bloco">
        <label>
          Data afetada
          <input v-model="dataSelecionada" type="date" :disabled="salvando" />
        </label>

        <button
          type="button"
          class="secundario"
          @click="adicionarData"
          :disabled="salvando"
        >
          Adicionar data
        </button>
      </div>

      <div v-if="datasAfetadas.length > 0" class="datas-lista">
        <span
          v-for="data in datasAfetadas"
          :key="data"
          class="data-item"
        >
          {{ formatarData(data) }}
          <button
            type="button"
            class="remover-data"
            @click="removerData(data)"
            :disabled="salvando"
            :aria-label="`Remover ${formatarData(data)}`"
          >
            x
          </button>
        </span>
      </div>

      <label>
        Descrição institucional
        <textarea
          v-model="descricao"
          rows="5"
          placeholder="Ex: Não houve atividades devido ao feriado de Carnaval."
          :disabled="salvando"
        ></textarea>
      </label>

      <p v-if="erro" class="erro">{{ erro }}</p>
      <p v-if="sucesso" class="sucesso">{{ sucesso }}</p>

      <div class="acoes">
        <button type="submit" :disabled="salvando || carregandoOficinas">
          {{ salvando ? 'Salvando...' : 'Salvar ocorrência' }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.ocorrencias-container {
  max-width: 920px;
  margin: 24px auto 48px;
  padding: 0 28px;
  color: #e2e8f0;
}

.ocorrencias-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.ocorrencias-header h2 {
  margin: 0;
  color: #f8fafc;
  font-size: 1.55rem;
}

.ocorrencias-header p {
  max-width: 680px;
  margin: 0;
  color: #94a3b8;
  line-height: 1.5;
}

.voltar {
  color: #7dd3fc;
  text-decoration: none;
  width: fit-content;
  font-weight: 700;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 22px 48px rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(16px);
}

.formulario label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #cbd5e1;
  font-size: 0.84rem;
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.datas-bloco {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
}

.datas-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.data-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 999px;
  background: rgba(14, 116, 144, 0.16);
  color: #dbeafe;
  font-size: 0.9rem;
  font-weight: 700;
}

.remover-data {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  line-height: 1;
}

input,
select,
textarea {
  padding: 11px 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  font: inherit;
  color: #e2e8f0;
  background: rgba(2, 6, 23, 0.55);
}

textarea {
  min-height: 140px;
  resize: vertical;
}

button {
  padding: 11px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  background: #0f172a;
  color: #ffffff;
  font-weight: 700;
  transition: background 0.2s ease, transform 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled,
input:disabled,
select:disabled,
textarea:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.secundario {
  background: #334155;
}

.erro {
  margin: 0;
  color: #f87171;
  font-weight: 700;
}

.sucesso {
  margin: 0;
  color: #4ade80;
  font-weight: 700;
}

.acoes {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 700px) {
  .ocorrencias-container {
    padding: 0 16px;
  }

  .grid,
  .datas-bloco {
    grid-template-columns: 1fr;
  }

  .acoes {
    justify-content: stretch;
  }

  .acoes button {
    width: 100%;
  }
}
</style>
