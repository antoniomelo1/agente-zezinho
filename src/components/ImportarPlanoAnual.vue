<script setup>
import { computed, onMounted, ref } from 'vue'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuthStore } from '../stores/authStore'
import { isRoleCoordenacao } from '../constants/roles'

const textoPlano = ref('')
const carregando = ref(false)
const jaExiste = ref(false)

const ANO_PLANO = '2026'
const authStore = useAuthStore()
const isCoordenador = computed(() => isRoleCoordenacao(authStore.role))

onMounted(async () => {
  const refPlano = doc(db, 'plano_anual', ANO_PLANO)
  const snap = await getDoc(refPlano)

  if (snap.exists()) {
    jaExiste.value = true
    textoPlano.value = snap.data().defesaProjetoAplicado || ''
  }
})

async function salvarPlano() {
  if (!textoPlano.value.trim()) {
    alert('Cole o texto do plano anual.')
    return
  }

  carregando.value = true

  try {
    await setDoc(
      doc(db, 'plano_anual', ANO_PLANO),
      {
        ano: Number(ANO_PLANO),
        defesaProjetoAplicado: textoPlano.value,
        atualizadoEm: Timestamp.now()
      },
      { merge: true }
    )

    jaExiste.value = true
    alert('Plano anual salvo com sucesso.')
  } catch (error) {
    console.error(error)
    alert('Erro ao salvar o plano anual.')
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <section class="plano-container">
    <router-link
      v-if="isCoordenador"
      to="/painel-coordenador"
      class="voltar-painel"
    >
      Voltar ao painel
    </router-link>

    <header>
      <h2>Plano Anual - {{ ANO_PLANO }}</h2>
      <p>
        Documento institucional anual de referência utilizado para contextualizar a Defesa do Projeto Aplicado.
      </p>
    </header>

    <textarea
      v-model="textoPlano"
      placeholder="Cole aqui o texto institucional anual de defesa do tema e da metodologia."
    ></textarea>

    <button @click="salvarPlano" :disabled="carregando">
      {{ carregando ? 'Salvando...' : 'Salvar plano anual' }}
    </button>

    <p v-if="jaExiste" class="aviso">
      Um plano anual já está salvo. Salvar novamente irá atualizar apenas esse conteúdo institucional.
    </p>
  </section>
</template>

<style scoped>
.plano-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.voltar-painel {
  display: inline-flex;
  align-items: center;
  margin-bottom: 18px;
  color: #00f2fe;
  text-decoration: none;
  font-weight: 700;
}

.voltar-painel:hover {
  text-decoration: underline;
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
