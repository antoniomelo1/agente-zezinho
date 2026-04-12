<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const registros = ref([])
const carregando = ref(true)

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

function resolverTemaDoRegistro(registro) {
  const temaManha = normalizarTexto(registro.temaDiaManha)
  const temaTarde = normalizarTexto(registro.temaDiaTarde)
  const temaLegado = normalizarTexto(registro.temaDia)

  if (temaManha && temaTarde) {
    return `${temaManha} / ${temaTarde}`
  }

  return temaManha || temaTarde || temaLegado || 'Nao informado'
}

async function carregarRegistros() {
  try {
    const snapshot = await getDocs(collection(db, 'registros_diarios'))

    registros.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erro ao buscar registros:', error)
  } finally {
    carregando.value = false
  }
}

const registrosOrdenados = computed(() => {
  return [...registros.value].sort((a, b) => new Date(b.data) - new Date(a.data))
})

function formatarData(data) {
  const d = new Date(`${data}T00:00:00`)
  return d.toLocaleDateString('pt-BR')
}

onMounted(carregarRegistros)
</script>

<template>
  <section class="lista-container">
    <header class="lista-header">
      <h2>Registros Diarios</h2>
      <p>Historico de aulas registradas</p>
    </header>

    <div v-if="carregando" class="loading">
      Carregando registros...
    </div>

    <div v-else>
      <div v-if="registrosOrdenados.length === 0" class="vazio">
        Nenhum registro encontrado.
      </div>

      <ul class="lista">
        <li
          v-for="registro in registrosOrdenados"
          :key="registro.id"
          class="item"
        >
          <div class="linha-principal">
            <strong>{{ formatarData(registro.data) }}</strong>
            <span class="tipo">{{ registro.tipoAula }}</span>
          </div>

          <div class="linha-secundaria">
            Tema: {{ resolverTemaDoRegistro(registro) }}
          </div>

          <div class="status">
            <span v-if="registro.resumoManha">Manha</span>
            <span v-if="registro.resumoTarde">Tarde</span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.lista-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px;
}

.lista-header {
  text-align: center;
  margin-bottom: 30px;
}

.lista-header h2 {
  margin: 0;
  color: #0f172a;
}

.lista-header p {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.9rem;
}

.loading,
.vazio {
  text-align: center;
  color: #64748b;
  margin-top: 40px;
}

.lista {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
}

.linha-principal {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tipo {
  font-size: 0.75rem;
  background: #e0e7ff;
  color: #1e3a8a;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.linha-secundaria {
  margin-top: 8px;
  color: #334155;
  font-size: 0.9rem;
}

.status {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #16a34a;
  font-weight: 600;
}
</style>
