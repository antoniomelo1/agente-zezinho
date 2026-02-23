<script setup>
import { ref, onMounted } from 'vue'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const textoPlano = ref('')
const carregando = ref(false)
const jaExiste = ref(false)

const ANO_PLANO = '2026'

// Verifica se já existe plano salvo
onMounted(async () => {
  const refPlano = doc(db, 'plano_anual', ANO_PLANO)
  const snap = await getDoc(refPlano)

  if (snap.exists()) {
    jaExiste.value = true
    textoPlano.value = snap.data().defesaProjetoAplicado
  }
})

// Salvar ou substituir plano
async function salvarPlano() {
  if (!textoPlano.value.trim()) {
    alert('Cole o texto do plano anual')
    return
  }

  carregando.value = true

  try {
    await setDoc(doc(db, 'plano_anual', ANO_PLANO), {
      ano: Number(ANO_PLANO),
      defesaProjetoAplicado: textoPlano.value,
      atualizadoEm: Timestamp.now()
    })

    jaExiste.value = true
    alert('Plano anual salvo com sucesso')
  } catch (error) {
    console.error(error)
    alert('Erro ao salvar o plano anual')
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <section class="plano-container">
    <header>
      <h2>Plano de Aulas Anual – {{ ANO_PLANO }}</h2>
      <p>
        Texto utilizado exclusivamente para contextualizar a Defesa do Projeto Aplicado
      </p>
    </header>

    <textarea
      v-model="textoPlano"
      placeholder="Cole aqui o texto institucional do Plano Anual"
    ></textarea>

    <button @click="salvarPlano" :disabled="carregando">
      {{ carregando ? 'Salvando...' : 'Salvar plano anual' }}
    </button>

    <p v-if="jaExiste" class="aviso">
      Um plano já está salvo. Salvar novamente irá substituir o conteúdo.
    </p>
  </section>
</template>

<style scoped>
.plano-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header p {
  color: #64748b;
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #cbd5f5;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

button {
  background: #1e293b;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  cursor: pointer;
}

.aviso {
  margin-top: 12px;
  color: #b45309;
  font-size: 0.85rem;
}
</style>
