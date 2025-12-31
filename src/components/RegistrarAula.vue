<script setup>
const API_URL = import.meta.env.VITE_API_URL
import { ref, nextTick } from 'vue'

const aula = ref({
  data: new Date().toISOString().substring(0, 10),
  turma: '',
  conteudo: '',
  temaAnterior: '',
  engajamento: '',
  progresso: '',
  dificuldade: '',
  ritmo: '',
  softOriente: '',
  softCoracao: '',
  observacao: ''
})

const resultadoIA = ref('')
const carregando = ref(false)
const resultadoSection = ref(null)
const loaderSection = ref(null) // Referência para o scroll do loader

async function analisarAula() {
  const resumo = `
Turma: ${aula.value.turma}
Tema da aula anterior: ${aula.value.temaAnterior}
Conteúdo: ${aula.value.conteudo}
Engajamento: ${aula.value.engajamento}
Progresso: ${aula.value.progresso}
Dificuldade predominante: ${aula.value.dificuldade}
Ritmo da aula: ${aula.value.ritmo}
Soft Skills – Sala Oriente: ${aula.value.softOriente}
Soft Skills – Sala Coração: ${aula.value.softCoracao}
Observação: ${aula.value.observacao || 'Não informada'}
`
  resultadoIA.value = ''
  carregando.value = true

  // Aguarda o Vue renderizar o loader e faz o scroll automático para ele
  await nextTick()
  if (loaderSection.value) {
    loaderSection.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  try {
    const response = await fetch(`${API_URL}/analisar-aula`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumo })
    })
    const data = await response.json()
    resultadoIA.value = data.resultado

    // Aguarda o resultado aparecer para rolar até ele
    await nextTick()
    if (resultadoSection.value) {
      resultadoSection.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

  } catch (error) {
    resultadoIA.value = 'Erro ao chamar a IA. Verifique a conexão com o servidor.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

const copiarTexto = () => {
  if (resultadoIA.value) {
    navigator.clipboard.writeText(resultadoIA.value)
    alert('Relatório copiado!')
  }
}

const limparFormulario = () => {
  aula.value = {
    data: new Date().toISOString().substring(0, 10),
    turma: '',
    conteudo: '',
    temaAnterior: '',
    engajagemento: '',
    progresso: '',
    dificuldade: '',
    ritmo: '',
    softOriente: '',
    softCoracao: '',
    observacao: ''
  }
  resultadoIA.value = ''
}
</script>

<template>
  <section class="container-aula">
    <header class="agent-header">
      <div class="avatar">Z</div>
      <div class="header-text">
        <h2>Agente Zezinho</h2>
        <p>Apoio pedagógico · Oficina de Programação · Casa do Zezinho</p>
      </div>
    </header>

    <form @submit.prevent="analisarAula" class="form-card">
      <fieldset class="form-section">
        <legend>Informações da Aula</legend>
        <div class="grid-row">
          <label>Data <input type="date" v-model="aula.data" /></label>
          <label>Turma
            <select v-model="aula.turma">
              <option disabled value="">Selecione</option>
              <option>Manhã</option>
              <option>Tarde</option>
            </select>
          </label>
        </div>
        <div class="grid-row">
          <label>Conteúdo
            <select v-model="aula.conteudo">
              <option disabled value="">Selecione</option>
              <option>HTML</option><option>CSS</option><option>JavaScript</option>
              <option>Bootstrap</option><option>IA</option>
            </select>
          </label>
          <label>Tema Anterior <input type="text" v-model="aula.temaAnterior" placeholder="Ex: Intro CSS" /></label>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>Desenvolvimento</legend>
        <div class="grid-row">
          <label>Engajamento
            <select v-model="aula.engajamento">
              <option disabled value="">Selecione</option>
              <option>Muito bom</option><option>Bom</option><option>Regular</option><option>Baixo</option>
            </select>
          </label>
          <label>Progresso
            <select v-model="aula.progresso">
              <option disabled value="">Selecione</option>
              <option>Concluiu</option><option>Parcial</option><option>Não concluiu</option>
            </select>
          </label>
        </div>
        <div class="grid-row">
          <label>Dificuldade
            <select v-model="aula.dificuldade">
              <option disabled value="">Selecione</option>
              <option>Sintaxe</option><option>Lógica</option><option>Organização</option><option>Atenção</option><option>Nenhuma</option>
            </select>
          </label>
          <label>Ritmo
            <select v-model="aula.ritmo">
              <option disabled value="">Selecione</option>
              <option>Adequado</option><option>Rápido</option><option>Lento</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>Avaliação Comportamental</legend>
        <div class="grid-row">
          <label>Soft Skills – Sala Oriente
            <select v-model="aula.softOriente">
              <option disabled value="">Selecione</option>
              <option>Muito bom</option><option>Bom</option><option>Regular</option><option>Precisa de atenção</option>
            </select>
          </label>
          <label>Soft Skills – Sala Coração
            <select v-model="aula.softCoracao">
              <option disabled value="">Selecione</option>
              <option>Muito bom</option><option>Bom</option><option>Regular</option><option>Precisa de atenção</option>
            </select>
          </label>
        </div>
      </fieldset>

      <label class="full-field">Observações
        <input type="text" v-model="aula.observacao" placeholder="Uma frase curta (opcional)" />
      </label>

      <button type="submit" :disabled="carregando" class="btn-analisar">
        {{ carregando ? 'Analisando...' : 'Analisar Aula' }}
      </button>
      <button type="button" @click="limparFormulario" class="btn-limpar" :disabled="carregando">
        Limpar Tudo
      </button>
    </form>

    <div v-if="carregando" ref="loaderSection" class="skeleton-loader">
      <p class="loader-text">Analisando dados com IA...</p>
    </div>

    <section v-if="resultadoIA" ref="resultadoSection" class="resultado-container">
      <div class="res-header">
        <h3>Análise Pedagógica</h3>
        <button type="button" @click="copiarTexto" class="btn-copy">Copiar relatório</button>
      </div>
      <pre>{{ resultadoIA }}</pre>
    </section>
  </section>
</template>

<style scoped>
.skeleton-loader {
  width: 100%;
  height: 120px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 16px;
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #cbd5e1;
}

.loader-text {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ESTRUTURA GERAL */
.container-aula {
  max-width: 650px;
  margin: 0 auto;
  padding: 20px;
  font-family: sans-serif;
}

/* CABEÇALHO E AVATAR Z */
.agent-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
}

.avatar {
  width: 60px;
  height: 60px;
  background-color: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.header-text { text-align: left; }
.header-text h2 { color: #1e293b !important; margin: 0; font-size: 1.8rem; }
.header-text p { color: #64748b !important; margin: 0; font-size: 0.9rem; }

/* O CARD DO FORMULÁRIO */
.form-card {
  background: #ffffff;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-section { border: none; padding: 0; margin: 0; }

legend { 
  color: #2563eb !important; 
  font-weight: 700; 
  font-size: 1.1rem;
  border-bottom: 2px solid #f1f5f9; 
  width: 100%; 
  margin-bottom: 20px; 
  padding-bottom: 8px;
  text-align: left;
}

.grid-row { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 20px; 
  margin-bottom: 15px; 
}

@media (max-width: 500px) { .grid-row { grid-template-columns: 1fr; } }

label { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  color: #334155 !important; 
  font-weight: 600; 
  font-size: 0.85rem; 
  text-align: left; 
}

input, select {
  height: 44px;
  background-color: #f8fafc !important;
  color: #1a1a1a !important;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  box-sizing: border-box;
  width: 100%;
  font-size: 1rem;
  transition: all 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: #2563eb;
  background-color: #ffffff !important;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.btn-analisar {
  background: #1e293b;
  color: white;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-analisar:hover { background: #0f172a; }
.btn-analisar:disabled { background: #94a3b8; cursor: not-allowed; }

.resultado-container {
  margin-top: 40px;
  background: #1e293b;
  color: #f8fafc;
  padding: 25px;
  border-radius: 16px;
  text-align: left;
}

.btn-limpar {
  background-color: transparent;
  color: #64748b;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-limpar:hover {
  background-color: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.res-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-copy { background: #334155; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.btn-copy:hover { background: #475569; }
pre { white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; margin: 0; font-family: inherit; }
</style>