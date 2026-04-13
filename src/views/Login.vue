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
  alert('Seu acesso ainda nao foi liberado. Procure o coordenador.')
}

const login = async () => {
  if (!email.value || !senha.value) {
    alert('Preencha todos os campos')
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
      alert('Perfil nao reconhecido')
    }
  } catch (error) {
    console.error(error)
    alert('Email ou senha invalidos')
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="container-auth">
    <h2>Login</h2>

    <input v-model="email" type="email" placeholder="Email" />
    <input v-model="senha" type="password" placeholder="Senha" />

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

button {
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
