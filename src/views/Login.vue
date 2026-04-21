<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/firebase'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '../stores/authStore'

const email = ref('')
const senha = ref('')
const carregando = ref(false)
const mostrarSenha = ref(false)

const router = useRouter()
const authStore = useAuthStore()

const possuiVinculoAtivo = (userData) => {
  if (userData?.ativo === false) {
    return false
  }

  if (userData?.status && userData.status !== 'ativo') {
    return false
  }

  return true
}

const encerrarSessaoBloqueada = async () => {
  authStore.limparUsuario()
  await signOut(auth)
  alert('Seu acesso ainda não foi liberado. Procure o coordenador.')
}

const login = async () => {
  if (!email.value || !senha.value) {
    alert('Preencha todos os campos.')
    return
  }

  try {
    carregando.value = true

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.value,
      senha.value
    )

    const uid = userCredential.user.uid
    const userDoc = await getDoc(doc(db, 'usuarios', uid))

    if (!userDoc.exists()) {
      await encerrarSessaoBloqueada()
      return
    }

    const userData = userDoc.data()

    if (!possuiVinculoAtivo(userData)) {
      await encerrarSessaoBloqueada()
      return
    }

    authStore.setUsuario({
      uid,
      ...userData
    })

    if (userData.role === 'coordenador') {
      router.push('/painel-coordenador')
    } else if (userData.role === 'educador') {
      router.push('/registro-diario')
    } else {
      authStore.limparUsuario()
      await signOut(auth)
      alert('Perfil não reconhecido.')
    }
  } catch (error) {
    console.error(error)
    alert('E-mail ou senha inválidos.')
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="container-auth">
    <h2>Login</h2>

    <input v-model="email" type="email" placeholder="E-mail" />
    <div class="campo-senha">
      <input
        v-model="senha"
        :type="mostrarSenha ? 'text' : 'password'"
        placeholder="Senha"
      />
      <button
        class="toggle-senha"
        type="button"
        :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
        :aria-pressed="mostrarSenha"
        @click="mostrarSenha = !mostrarSenha"
      >
        {{ mostrarSenha ? 'Ocultar' : 'Mostrar' }}
      </button>
    </div>

    <button @click="login" :disabled="carregando">
      {{ carregando ? 'Entrando...' : 'Entrar' }}
    </button>
  </div>
</template>

<style scoped>
.container-auth {
  max-width: 400px;
  margin: 80px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #444;
}

.campo-senha {
  position: relative;
  display: flex;
  align-items: center;
}

.campo-senha input {
  width: 100%;
  padding-right: 86px;
}

.toggle-senha {
  position: absolute;
  right: 6px;
  width: auto;
  padding: 6px 8px;
  border: 1px solid rgba(0, 242, 254, 0.35);
  background: rgba(15, 23, 42, 0.8);
  color: #00f2fe;
  font-size: 0.75rem;
  font-weight: 600;
}

button {
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
