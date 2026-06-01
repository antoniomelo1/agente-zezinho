<script setup>
import { computed, onMounted, ref } from 'vue'
import { auth } from '../firebase/firebase.js'
import { useAuthStore } from '../stores/authStore'
import {
  ROLES,
  isRoleCoordenacaoPedagogica,
  isRoleCoordenadorPedagogico,
  isRoleGestorPedagogico
} from '../constants/roles'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore()

const usuarios = ref([])
const oficinas = ref([])
const carregandoUsuarios = ref(false)
const carregandoOficinas = ref(false)
const salvandoEducador = ref(false)
const salvandoCoordenador = ref(false)
const processandoUid = ref('')
const erro = ref('')
const sucesso = ref('')
const linkPrimeiroAcesso = ref('')

const novoEducador = ref({
  nome: '',
  email: '',
  oficinaId: ''
})

const novoCoordenador = ref({
  nome: '',
  email: '',
  oficinaId: ''
})

const isGestorPedagogico = computed(() => isRoleGestorPedagogico(authStore.role))
const isCoordenadorPedagogico = computed(() =>
  isRoleCoordenadorPedagogico(authStore.role)
)
const isCoordenacaoPedagogica = computed(() =>
  isRoleCoordenacaoPedagogica(authStore.role)
)
const oficinaPadraoId = computed(() => oficinas.value[0]?.id || '')
const descricaoCabecalho = computed(() =>
  isGestorPedagogico.value
    ? 'Administração institucional de acessos para educadores e coordenadores pedagógicos.'
    : 'Gestão de educadores vinculados ao seu escopo institucional.'
)
const tituloLista = computed(() =>
  isGestorPedagogico.value ? 'Usuários institucionais' : 'Educadores do escopo institucional'
)
const descricaoLista = computed(() =>
  isGestorPedagogico.value
    ? 'Lista de contas vinculadas ao sistema.'
    : 'Lista de educadores vinculados às oficinas sob sua responsabilidade.'
)

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Usuário não autenticado.')
  }

  return usuario.getIdToken()
}

function limparMensagens() {
  erro.value = ''
  sucesso.value = ''
}

function limparLink() {
  linkPrimeiroAcesso.value = ''
}

function textoRole(role) {
  if (role === ROLES.GESTOR_PEDAGOGICO) {
    return 'Gestor pedagógico'
  }

  if (role === ROLES.COORDENADOR_PEDAGOGICO) {
    return 'Coordenador pedagógico'
  }

  if (role === ROLES.EDUCADOR) {
    return 'Educador'
  }

  return role || 'Não informado'
}

function textoStatus(usuario) {
  if (usuario.authDisabled || usuario.ativo === false || usuario.status === 'inativo') {
    return 'Inativo'
  }

  if (usuario.status === 'pendente_ativacao') {
    return 'Pendente de ativação'
  }

  return 'Ativo'
}

function classeStatus(usuario) {
  if (usuario.authDisabled || usuario.ativo === false || usuario.status === 'inativo') {
    return 'status-inativo'
  }

  if (usuario.status === 'pendente_ativacao') {
    return 'status-pendente'
  }

  return 'status-ativo'
}

function textoOficina(oficinaId) {
  if (!oficinaId) {
    return '-'
  }

  return oficinas.value.find((oficina) => oficina.id === oficinaId)?.nome || oficinaId
}

function podeAlterarUsuario(usuario) {
  if (!usuario?.uid) {
    return false
  }

  if (usuario.uid === authStore.uid) {
    return false
  }

  return usuario.role !== ROLES.GESTOR_PEDAGOGICO
}

function usuarioEstaInativo(usuario) {
  return usuario.authDisabled || usuario.ativo === false || usuario.status === 'inativo'
}

async function carregarUsuarios() {
  if (!isCoordenacaoPedagogica.value) {
    return
  }

  carregandoUsuarios.value = true

  try {
    const token = await obterToken()
    const endpoint = isGestorPedagogico.value ? '/admin/usuarios' : '/usuarios/educadores'
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Não foi possível carregar os usuários institucionais.')
    }

    if (isGestorPedagogico.value) {
      usuarios.value = Array.isArray(data.usuarios) ? data.usuarios : []
    } else {
      usuarios.value = Array.isArray(data.educadores)
        ? data.educadores.map((educador) => ({
            ...educador,
            role: ROLES.EDUCADOR
          }))
        : []
    }
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Não foi possível carregar os usuários institucionais.'
  } finally {
    carregandoUsuarios.value = false
  }
}

function aplicarOficinaPadrao() {
  if (!novoEducador.value.oficinaId) {
    novoEducador.value.oficinaId = oficinaPadraoId.value
  }

  if (!novoCoordenador.value.oficinaId) {
    novoCoordenador.value.oficinaId = oficinaPadraoId.value
  }
}

async function carregarOficinas() {
  if (!isCoordenacaoPedagogica.value) {
    return
  }

  carregandoOficinas.value = true

  try {
    const token = await obterToken()
    const endpoint = isGestorPedagogico.value ? '/admin/oficinas' : '/coordenador/oficinas'
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'NÃ£o foi possÃ­vel carregar as oficinas institucionais.')
    }

    oficinas.value = Array.isArray(data.oficinas) ? data.oficinas : []
    aplicarOficinaPadrao()
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'NÃ£o foi possÃ­vel carregar as oficinas institucionais.'
  } finally {
    carregandoOficinas.value = false
  }
}

async function criarUsuario(endpoint, payload, estadoCarregando, mensagemSucesso) {
  limparMensagens()
  limparLink()
  estadoCarregando.value = true

  try {
    const token = await obterToken()
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Não foi possível criar o usuário institucional.')
    }

    sucesso.value = mensagemSucesso
    linkPrimeiroAcesso.value = data.linkPrimeiroAcesso || ''
    await carregarUsuarios()
    return true
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Não foi possível criar o usuário institucional.'
    return false
  } finally {
    estadoCarregando.value = false
  }
}

async function criarEducador() {
  const criado = await criarUsuario(
    isGestorPedagogico.value ? '/admin/usuarios/educadores' : '/usuarios/educadores',
    novoEducador.value,
    salvandoEducador,
    'Educador criado com sucesso. O link institucional de primeiro acesso foi gerado.'
  )

  if (criado) {
    novoEducador.value = {
      nome: '',
      email: '',
      oficinaId: oficinaPadraoId.value
    }
  }
}

async function criarCoordenador() {
  if (!isGestorPedagogico.value) {
    return
  }

  const criado = await criarUsuario(
    '/admin/usuarios/coordenadores',
    {
      ...novoCoordenador.value,
      role: ROLES.COORDENADOR_PEDAGOGICO
    },
    salvandoCoordenador,
    'Coordenador pedagógico criado com sucesso. O link institucional de primeiro acesso foi gerado.'
  )

  if (criado) {
    novoCoordenador.value = {
      nome: '',
      email: '',
      oficinaId: oficinaPadraoId.value
    }
  }
}

async function alterarStatusUsuario(usuario, acao) {
  if (!isGestorPedagogico.value) {
    return
  }

  if (!podeAlterarUsuario(usuario)) {
    return
  }

  let motivoDesabilitacao = ''

  if (acao === 'desabilitar') {
    const confirmado = window.confirm(
      `Desabilitar o acesso institucional de ${usuario.nome || usuario.email}?`
    )

    if (!confirmado) {
      return
    }

    motivoDesabilitacao =
      window.prompt('Motivo da desabilitação institucional:', '') || ''
  }

  limparMensagens()
  processandoUid.value = usuario.uid

  try {
    const token = await obterToken()
    const response = await fetch(`${API_URL}/admin/usuarios/${usuario.uid}/${acao}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        motivoDesabilitacao
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Não foi possível atualizar o usuário institucional.')
    }

    sucesso.value = data.mensagem || 'Usuário atualizado com sucesso.'
    await carregarUsuarios()
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Não foi possível atualizar o usuário institucional.'
  } finally {
    processandoUid.value = ''
  }
}

async function reenviarConvite(usuario) {
  if (!isCoordenadorPedagogico.value || usuario?.status !== 'pendente_ativacao') {
    return
  }

  limparMensagens()
  limparLink()
  processandoUid.value = usuario.uid

  try {
    const token = await obterToken()
    const response = await fetch(
      `${API_URL}/coordenador/educadores/${usuario.uid}/reenviar-convite`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Não foi possível reenviar o convite institucional.')
    }

    sucesso.value = data.mensagem || 'Convite institucional reenviado com sucesso.'
    linkPrimeiroAcesso.value = data.linkPrimeiroAcesso || ''
    await carregarUsuarios()
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Não foi possível reenviar o convite institucional.'
  } finally {
    processandoUid.value = ''
  }
}

onMounted(async () => {
  await carregarOficinas()
  carregarUsuarios()
})
</script>

<template>
  <section class="gestao-usuarios">
    <header class="cabecalho">
      <router-link to="/painel-coordenador" class="voltar-painel">
        Voltar ao painel
      </router-link>

      <h2>Gestão de Usuários</h2>
      <p>{{ descricaoCabecalho }}</p>
    </header>

    <p v-if="!isCoordenacaoPedagogica" class="erro">
      Esta área é restrita à coordenação pedagógica.
    </p>

    <template v-else>
      <section class="formularios">
        <form class="painel" @submit.prevent="criarEducador">
          <div>
            <h3>Novo educador</h3>
            <p>Cria conta institucional vinculada a uma oficina.</p>
          </div>

          <input v-model="novoEducador.nome" type="text" placeholder="Nome completo" />
          <input v-model="novoEducador.email" type="email" placeholder="E-mail institucional" />

          <select
            v-model="novoEducador.oficinaId"
            :disabled="carregandoOficinas || oficinas.length === 0"
          >
            <option disabled value="">Selecione uma oficina</option>
            <option v-for="oficina in oficinas" :key="oficina.id" :value="oficina.id">
              {{ oficina.nome }}
            </option>
          </select>

          <button type="submit" :disabled="salvandoEducador || !novoEducador.oficinaId">
            {{ salvandoEducador ? 'Criando...' : 'Criar educador' }}
          </button>
        </form>

        <form v-if="isGestorPedagogico" class="painel" @submit.prevent="criarCoordenador">
          <div>
            <h3>Novo coordenador pedagógico</h3>
            <p>Cria conta de coordenação pedagógica. Gestor pedagógico não é criado por esta tela.</p>
          </div>

          <input v-model="novoCoordenador.nome" type="text" placeholder="Nome completo" />
          <input v-model="novoCoordenador.email" type="email" placeholder="E-mail institucional" />

          <select
            v-model="novoCoordenador.oficinaId"
            :disabled="carregandoOficinas || oficinas.length === 0"
          >
            <option disabled value="">Selecione uma oficina</option>
            <option v-for="oficina in oficinas" :key="oficina.id" :value="oficina.id">
              {{ oficina.nome }}
            </option>
          </select>

          <button type="submit" :disabled="salvandoCoordenador || !novoCoordenador.oficinaId">
            {{ salvandoCoordenador ? 'Criando...' : 'Criar coordenador pedagógico' }}
          </button>
        </form>
      </section>

      <p v-if="erro" class="erro">{{ erro }}</p>
      <p v-if="sucesso" class="sucesso">{{ sucesso }}</p>

      <div v-if="linkPrimeiroAcesso" class="link-box">
        <p>Link institucional de primeiro acesso:</p>
        <textarea readonly :value="linkPrimeiroAcesso"></textarea>
      </div>

      <section class="painel lista-usuarios">
        <div class="lista-topo">
          <div>
            <h3>{{ tituloLista }}</h3>
            <p>{{ descricaoLista }}</p>
          </div>

          <button type="button" class="secundario" @click="carregarUsuarios">
            Atualizar lista
          </button>
        </div>

        <p v-if="carregandoUsuarios">Carregando usuários...</p>

        <div v-else class="tabela-scroll">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th v-if="isGestorPedagogico">Perfil</th>
                <th>Oficina</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="usuario in usuarios" :key="usuario.uid">
                <td data-label="Nome">{{ usuario.nome || '-' }}</td>
                <td data-label="E-mail">{{ usuario.email || '-' }}</td>
                <td v-if="isGestorPedagogico" data-label="Perfil">{{ textoRole(usuario.role) }}</td>
                <td data-label="Oficina">
                  {{ textoOficina(usuario.oficinaId || usuario.oficinasResponsaveis?.[0]) }}
                </td>
                <td data-label="Status">
                  <span :class="['status', classeStatus(usuario)]">
                    {{ textoStatus(usuario) }}
                  </span>
                </td>
                <td data-label="Ações" class="acoes">
                  <template v-if="isGestorPedagogico">
                    <span v-if="usuario.uid === authStore.uid" class="texto-apoio">
                      Conta atual
                    </span>
                    <span v-else-if="usuario.role === ROLES.GESTOR_PEDAGOGICO" class="texto-apoio">
                      Protegido
                    </span>
                    <button
                      v-else-if="usuarioEstaInativo(usuario)"
                      type="button"
                      @click="alterarStatusUsuario(usuario, 'habilitar')"
                      :disabled="processandoUid === usuario.uid"
                    >
                      {{ processandoUid === usuario.uid ? 'Habilitando...' : 'Habilitar' }}
                    </button>
                    <button
                      v-else
                      type="button"
                      class="perigo"
                      @click="alterarStatusUsuario(usuario, 'desabilitar')"
                      :disabled="processandoUid === usuario.uid"
                    >
                      {{ processandoUid === usuario.uid ? 'Desabilitando...' : 'Desabilitar' }}
                    </button>
                  </template>
                  <template v-else>
                    <button
                      v-if="usuario.status === 'pendente_ativacao'"
                      type="button"
                      @click="reenviarConvite(usuario)"
                      :disabled="processandoUid === usuario.uid"
                    >
                      {{ processandoUid === usuario.uid ? 'Reenviando...' : 'Reenviar convite' }}
                    </button>
                    <span v-else class="texto-apoio">
                      Sem ação disponível
                    </span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.gestao-usuarios {
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

.cabecalho p,
.painel p,
.texto-apoio {
  margin: 0;
  color: #94a3b8;
  line-height: 1.5;
}

.formularios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
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

input,
select,
textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.55);
  color: #e2e8f0;
  font: inherit;
}

textarea {
  min-height: 100px;
  resize: vertical;
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

.perigo {
  background: #7f1d1d;
}

.erro {
  color: #fca5a5;
  font-weight: 700;
}

.sucesso {
  color: #86efac;
  font-weight: 700;
}

.link-box {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(125, 211, 252, 0.25);
  background: rgba(2, 6, 23, 0.45);
}

.link-box p {
  margin: 0 0 8px;
  color: #cbd5e1;
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

.status {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
}

.status-ativo {
  color: #4ade80;
  background: rgba(22, 163, 74, 0.14);
}

.status-pendente {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.14);
}

.status-inativo {
  color: #fca5a5;
  background: rgba(127, 29, 29, 0.24);
}

.acoes {
  min-width: 140px;
}

.acoes button {
  width: 100%;
}

@media (max-width: 760px) {
  .lista-topo {
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
    grid-template-columns: 110px minmax(0, 1fr);
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
