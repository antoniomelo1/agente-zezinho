<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const nome = ref('')
const email = ref('')
const senha = ref('')
const carregando = ref(false)

const router = useRouter()

const cadastrar = async () => {
  if (!nome.value || !email.value || !senha.value) {
    alert('Preencha todos os campos.')
    return
  }

  try {
    carregando.value = true

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value,
      senha.value
    )

    const uid = userCredential.user.uid

    await setDoc(doc(db, 'usuarios', uid), {
      uid,
      nome: nome.value,
      email: email.value,
      role: 'coordenador',
      status: 'ativo',
      oficinasResponsaveis: [],
      ativo: true,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    })

    router.push('/painel-coordenador')

  } catch (error) {
    alert(error.message)
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="container-auth">
    <h2>Cadastro de Coordenador</h2>

    <input v-model="nome" type="text" placeholder="Nome completo" />
    <input v-model="email" type="email" placeholder="Email institucional" />
    <input v-model="senha" type="password" placeholder="Senha" />

    <button @click="cadastrar" :disabled="carregando">
      {{ carregando ? 'Criando...' : 'Criar conta' }}
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
