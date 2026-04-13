<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode
} from 'firebase/auth'
import { auth } from '../firebase/firebase'

const API_URL = import.meta.env.VITE_API_URL

const route = useRoute()
const router = useRouter()

const email = ref('')
const novaSenha = ref('')
const confirmarSenha = ref('')
const carregando = ref(false)
const verificandoCodigo = ref(true)
const erro = ref('')
const sucesso = ref('')

function obterMensagemErroValidacao(error) {
  if (error?.code === 'auth/expired-action-code') {
    return 'Este link expirou. Solicite um novo acesso ao coordenador.'
  }

  if (error?.code === 'auth/invalid-action-code') {
    return 'Link de primeiro acesso invalido.'
  }

  return 'Link de primeiro acesso invalido ou expirado.'
}

function obterMensagemErroConfirmacao(error) {
  if (error?.code === 'auth/expired-action-code') {
    return 'Este link expirou. Solicite um novo acesso ao coordenador.'
  }

  if (error?.code === 'auth/invalid-action-code') {
    return 'Este link ja foi utilizado. Solicite um novo acesso ao coordenador.'
  }

  return error?.message || 'Nao foi possivel concluir o primeiro acesso.'
}

async function ativarPrimeiroAcesso() {
  const usuario = auth.currentUser

  if (!usuario) {
    throw new Error('Nao foi possivel autenticar o educador apos a redefinicao')
  }

  const token = await usuario.getIdToken()
  const response = await fetch(`${API_URL}/usuarios/ativar-primeiro-acesso`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.erro || 'Erro ao ativar primeiro acesso')
  }
}

async function concluirPrimeiroAcesso() {
  if (!novaSenha.value || !confirmarSenha.value) {
    erro.value = 'Informe e confirme a nova senha.'
    return
  }

  if (novaSenha.value.length < 6) {
    erro.value = 'A senha deve ter pelo menos 6 caracteres.'
    return
  }

  if (novaSenha.value !== confirmarSenha.value) {
    erro.value = 'As senhas informadas nao coincidem.'
    return
  }

  const oobCode = String(route.query.oobCode || '')

  if (!oobCode || !email.value) {
    erro.value = 'Link de primeiro acesso invalido.'
    return
  }

  erro.value = ''
  sucesso.value = ''
  carregando.value = true

  try {
    await confirmPasswordReset(auth, oobCode, novaSenha.value)
    await signInWithEmailAndPassword(auth, email.value, novaSenha.value)
    await ativarPrimeiroAcesso()
    await signOut(auth)

    sucesso.value =
      'Senha redefinida com sucesso. Seu acesso institucional foi ativado. Agora voce ja pode entrar pelo login.'
    novaSenha.value = ''
    confirmarSenha.value = ''
  } catch (error) {
    console.error(error)
    erro.value = obterMensagemErroConfirmacao(error)
  } finally {
    carregando.value = false
  }
}

function irParaLogin() {
  router.push('/login')
}

onMounted(async () => {
  const mode = String(route.query.mode || '')
  const oobCode = String(route.query.oobCode || '')

  if (mode !== 'resetPassword' || !oobCode) {
    erro.value = 'Link de primeiro acesso invalido.'
    verificandoCodigo.value = false
    return
  }

  try {
    email.value = await verifyPasswordResetCode(auth, oobCode)
  } catch (error) {
    console.error(error)
    erro.value = obterMensagemErroValidacao(error)
  } finally {
    verificandoCodigo.value = false
  }
})
</script>

<template>
  <div class="container-primeiro-acesso">
    <h2>Primeiro acesso</h2>

    <p v-if="verificandoCodigo">Validando link institucional...</p>

    <template v-else>
      <p v-if="email" class="email">Conta vinculada: {{ email }}</p>

      <input
        v-model="novaSenha"
        type="password"
        placeholder="Nova senha"
        :disabled="!!sucesso"
      />

      <input
        v-model="confirmarSenha"
        type="password"
        placeholder="Confirmar nova senha"
        :disabled="!!sucesso"
      />

      <button
        v-if="!sucesso"
        @click="concluirPrimeiroAcesso"
        :disabled="carregando || !email"
      >
        {{ carregando ? 'Concluindo...' : 'Concluir primeiro acesso' }}
      </button>

      <button v-else @click="irParaLogin">Ir para login</button>

      <p v-if="erro" class="erro">{{ erro }}</p>
      <p v-if="sucesso" class="sucesso">{{ sucesso }}</p>
    </template>
  </div>
</template>

<style scoped>
.container-primeiro-acesso {
  max-width: 420px;
  margin: 80px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.email {
  color: #334155;
}

input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #444;
}

button {
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}

.erro {
  color: #b91c1c;
}

.sucesso {
  color: #166534;
}
</style>
