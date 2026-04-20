<script setup>
import { computed, onMounted, ref } from 'vue'
import { auth } from '../firebase/firebase.js'
import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL
const authStore = useAuthStore()

function obterAnoAtual() {
  return String(new Date().getFullYear())
}

function obterSemestreAtual() {
  return new Date().getMonth() + 1 <= 6 ? '1' : '2'
}

const ano = ref(obterAnoAtual())
const semestre = ref(obterSemestreAtual())
const titulo = ref('')
const versao = ref('')
const conteudo = ref('')
const eixoPedagogia = ref('')
const recursosPadrao = ref('')
const documentoEdicaoId = ref('')
const documentos = ref([])
const carregando = ref(false)
const salvando = ref(false)
const ativandoId = ref('')
const desativandoId = ref('')
const erro = ref('')
const sucesso = ref('')

const isCoordenador = computed(() => authStore.role === 'coordenador')
const isEducador = computed(() => authStore.role === 'educador')

function formatarSemestreLabel(semestreAtual) {
  return String(semestreAtual) === '1' ? '1º semestre' : '2º semestre'
}

async function obterToken() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Usuário não autenticado.')
  }

  return usuario.getIdToken()
}

function limparFormulario() {
  documentoEdicaoId.value = ''
  titulo.value = ''
  versao.value = ''
  conteudo.value = ''
  eixoPedagogia.value = ''
  recursosPadrao.value = ''
  erro.value = ''
  sucesso.value = ''
}

function preencherFormulario(documento) {
  documentoEdicaoId.value = documento.id
  ano.value = String(documento.ano || '')
  semestre.value = String(documento.semestre || '')
  titulo.value = documento.titulo || ''
  versao.value = String(documento.versao || '')
  conteudo.value = documento.conteudo || ''
  eixoPedagogia.value = documento.eixoPedagogia || ''
  recursosPadrao.value = Array.isArray(documento.recursosPadrao)
    ? documento.recursosPadrao.join('\n')
    : ''
}

async function carregarDocumentos() {
  erro.value = ''
  carregando.value = true

  try {
    const token = await obterToken()
    const query = new URLSearchParams()

    if (ano.value) {
      query.set('ano', ano.value)
    }

    if (semestre.value) {
      query.set('semestre', semestre.value)
    }

    const response = await fetch(
      `${API_URL}/documento-base-plano-mensal?${query.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao carregar documentos base.'
      return
    }

    documentos.value = Array.isArray(data.documentos) ? data.documentos : []
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Erro ao carregar documentos base.'
  } finally {
    carregando.value = false
  }
}

async function salvarDocumento() {
  erro.value = ''
  sucesso.value = ''
  salvando.value = true

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/documento-base-plano-mensal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: documentoEdicaoId.value || null,
        ano: Number(ano.value),
        semestre: Number(semestre.value),
        titulo: titulo.value,
        versao: Number(versao.value),
        conteudo: conteudo.value,
        eixoPedagogia: eixoPedagogia.value,
        recursosPadrao: recursosPadrao.value
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao salvar documento base.'
      return
    }

    sucesso.value = documentoEdicaoId.value
      ? 'Documento base atualizado com sucesso.'
      : 'Nova versão do documento base salva com sucesso.'

    preencherFormulario(data)
    await carregarDocumentos()
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Erro ao salvar documento base.'
  } finally {
    salvando.value = false
  }
}

async function ativarDocumento(documentoId) {
  erro.value = ''
  sucesso.value = ''
  ativandoId.value = documentoId

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/documento-base-plano-mensal/ativar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        documentoId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao ativar documento base.'
      return
    }

    sucesso.value = `Versão ${data.versao} ativada com sucesso.`
    await carregarDocumentos()
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Erro ao ativar documento base.'
  } finally {
    ativandoId.value = ''
  }
}

async function desativarDocumento(documentoId) {
  const confirmarDesativacao = window.confirm(
    'Você está prestes a desativar esta versão do Documento Base do Plano Mensal.\n\nAo desativar, este período poderá ficar sem uma versão ativa, o que pode impedir a geração do plano mensal.\n\nDeseja continuar?'
  )

  if (!confirmarDesativacao) {
    return
  }

  erro.value = ''
  sucesso.value = ''
  desativandoId.value = documentoId

  try {
    const token = await obterToken()

    const response = await fetch(`${API_URL}/documento-base-plano-mensal/desativar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        documentoId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      erro.value = data.erro || 'Erro ao desativar documento base.'
      return
    }

    sucesso.value = `Versão ${data.versao} desativada com sucesso.`
    await carregarDocumentos()
  } catch (errorAtual) {
    console.error(errorAtual)
    erro.value = errorAtual.message || 'Erro ao desativar documento base.'
  } finally {
    desativandoId.value = ''
  }
}

onMounted(() => {
  carregarDocumentos()
})
</script>

<template>
  <section class="documento-base-container">
    <header class="documento-base-header">
      <h2>Documento Base do Plano Mensal</h2>
      <p>Gestão institucional das versões que orientarão a elaboração do plano de aulas mensal.</p>
      <div v-if="isEducador" class="aviso-educador">
        O educador pode elaborar e editar versões do Documento Base do Plano Mensal.
        A ativação da versão é realizada pela coordenação após revisão institucional.
      </div>
      <p v-if="isCoordenador" class="texto-governanca">
        A coordenação revisa as versões elaboradas e valida institucionalmente a ativação do período.
      </p>
    </header>

    <section class="filtros">
      <label>
        Ano
        <input v-model="ano" type="number" />
      </label>

      <label>
        Semestre
        <select v-model="semestre">
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </label>

      <button @click="carregarDocumentos" :disabled="carregando">
        {{ carregando ? 'Carregando...' : 'Carregar versões' }}
      </button>
    </section>

    <section v-if="isEducador" class="formulario">
      <label>
        Título
        <input v-model="titulo" type="text" placeholder="Documento Base - Plano de Aulas" />
      </label>

      <label>
        Versão
        <input v-model="versao" type="number" min="1" />
      </label>

      <p class="texto-apoio">
        Esta versão será cadastrada para o período {{ ano || 'informado' }} -
        {{ formatarSemestreLabel(semestre) }}. O semestre selecionado deve corresponder
        ao título e ao conteúdo institucional do documento.
      </p>

      <label>
        Conteúdo
        <textarea v-model="conteudo" rows="8"></textarea>
      </label>

      <label>
        Eixo da pedagogia
        <input v-model="eixoPedagogia" type="text" />
      </label>

      <label>
        Recursos padrão
        <textarea
          v-model="recursosPadrao"
          rows="5"
          placeholder="Um recurso por linha"
        ></textarea>
      </label>

      <div class="acoes-formulario">
        <button @click="salvarDocumento" :disabled="salvando">
          {{ salvando ? 'Salvando...' : documentoEdicaoId ? 'Atualizar versão' : 'Salvar nova versão' }}
        </button>

        <button class="secundario" @click="limparFormulario" :disabled="salvando">
          Limpar
        </button>
      </div>
    </section>

    <p v-if="erro" class="erro">{{ erro }}</p>
    <p v-if="sucesso" class="sucesso">{{ sucesso }}</p>

    <section class="lista-documentos">
      <article
        v-for="documento in documentos"
        :key="documento.id"
        class="documento-card"
      >
        <div class="documento-card-topo">
          <div>
            <h3>{{ documento.titulo }}</h3>
            <p>Ano {{ documento.ano }} - Semestre {{ documento.semestre }} - Versão {{ documento.versao }}</p>
          </div>
          <span :class="documento.ativo ? 'status ativo' : 'status inativo'">
            {{ documento.ativo ? 'Versão ativa do período' : 'Versão inativa' }}
          </span>
        </div>

        <p v-if="documento.ativo" class="documento-destaque">
          Esta versão alimenta a geração do Plano de Aulas Mensal deste período.
        </p>

        <p><strong>Oficina:</strong> {{ documento.oficinaId || 'Não informada' }}</p>
        <p><strong>Eixo da pedagogia:</strong> {{ documento.eixoPedagogia || 'Não informado' }}</p>
        <p><strong>Recursos:</strong> {{ documento.recursosPadrao.join(', ') || 'Não informados' }}</p>
        <p
          v-if="documento.criadoPor?.nome || documento.atualizadoPor?.nome"
          class="documento-meta"
        >
          <span v-if="documento.criadoPor?.nome">
            Criado por {{ documento.criadoPor.nome }}
          </span>
          <span v-if="documento.criadoPor?.nome && documento.atualizadoPor?.nome">
            ·
          </span>
          <span v-if="documento.atualizadoPor?.nome">
            Atualizado por {{ documento.atualizadoPor.nome }}
          </span>
        </p>

        <div class="acoes-documento">
          <button
            v-if="isEducador"
            class="secundario"
            @click="preencherFormulario(documento)"
          >
            Editar
          </button>

          <button
            v-if="isCoordenador"
            @click="ativarDocumento(documento.id)"
            :disabled="ativandoId === documento.id || documento.ativo"
          >
            {{
              documento.ativo
                ? 'Versão ativa'
                : ativandoId === documento.id
                  ? 'Ativando...'
                  : 'Ativar versão'
            }}
          </button>

          <button
            v-if="isCoordenador && documento.ativo"
            class="secundario"
            @click="desativarDocumento(documento.id)"
            :disabled="desativandoId === documento.id"
          >
            {{ desativandoId === documento.id ? 'Desativando...' : 'Desativar versão' }}
          </button>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.documento-base-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.documento-base-header h2 {
  margin-bottom: 6px;
}

.texto-governanca {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.aviso-educador {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(125, 211, 252, 0.28);
  background: rgba(14, 116, 144, 0.14);
  color: #dbeafe;
  line-height: 1.5;
}

.filtros,
.acoes-formulario,
.acoes-documento {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filtros label,
.formulario label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #e2e8f0;
}

.formulario,
.lista-documentos {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.texto-apoio {
  margin: -4px 0 4px;
  color: #cbd5e1;
  line-height: 1.5;
}

input,
select,
textarea {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(2, 6, 23, 0.55);
  color: #e2e8f0;
  font: inherit;
}

textarea {
  resize: vertical;
}

button {
  padding: 10px 16px;
  border: none;
  border-radius: 12px;
  background: #0f172a;
  color: #fff;
  cursor: pointer;
}

.secundario {
  background: #334155;
}

.documento-card {
  padding: 18px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.75);
  color: #e2e8f0;
}

.documento-meta {
  font-size: 0.9rem;
  color: #cbd5e1;
}

.documento-destaque {
  margin: 10px 0 0;
  color: #86efac;
  font-weight: 600;
}

.documento-card-topo {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.ativo {
  background: rgba(22, 163, 74, 0.2);
  color: #4ade80;
}

.inativo {
  background: rgba(148, 163, 184, 0.18);
  color: #cbd5e1;
}

.erro {
  color: #f87171;
}

.sucesso {
  color: #4ade80;
}

@media (max-width: 700px) {
  .documento-card-topo {
    flex-direction: column;
  }
}
</style>
