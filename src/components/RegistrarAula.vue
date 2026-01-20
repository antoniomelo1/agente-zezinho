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
        <p>Apoio pedagógico · Oficina de Programação</p>
      </div>
    </header>

    <form @submit.prevent="analisarAula" class="form-card">
      <fieldset class="form-section">
        <legend><span>📝</span> Informações da Aula</legend>
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
        <legend><span>🚀</span> Desenvolvimento</legend>
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
        <legend><span>🧠</span> Avaliação Comportamental</legend>
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

      <label class="full-field"><span>💬</span> Observações
        <input type="text" v-model="aula.observacao" placeholder="Uma frase curta (opcional)" />
      </label>

      <div class="actions">
        <button type="submit" :disabled="carregando" class="btn-analisar">
          {{ carregando ? 'Analisando...' : 'Analisar Aula' }}
        </button>
        <button type="button" @click="limparFormulario" class="btn-limpar" :disabled="carregando">
          Limpar Tudo
        </button>
      </div>
    </form>

    <Transition name="fade">
      <div v-if="carregando" ref="loaderSection" class="skeleton-loader">
        <div class="spinner"></div>
        <p class="loader-text">A IA está gerando sua análise...</p>
      </div>
    </Transition>

    <Transition name="fade">
      <section v-if="resultadoIA" ref="resultadoSection" class="resultado-container">
        <div class="res-header">
          <h3><span>✨</span> Análise Pedagógica</h3>
          <button type="button" @click="copiarTexto" class="btn-copy">Copiar relatório</button>
        </div>
        <pre>{{ resultadoIA }}</pre>
      </section>
    </Transition>
  </section>
</template>

<style scoped>
/* ANIMAÇÕES */
.fade-enter-active, .fade-leave-active {
  transition: all 0.4s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ESTRUTURA GERAL */
.container-aula {
  max-width: 650px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* CABEÇALHO */
.agent-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
}

.avatar {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border-radius: 18px; /* Square arredondado mais moderno */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 800;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.header-text h2 { 
  color: #0f172a !important; 
  margin: 0; 
  font-size: 1.6rem; 
  letter-spacing: -0.025em;
}

.header-text p { 
  color: #64748b !important; 
  margin: 4px 0 0 0; 
  font-size: 0.9rem; 
  font-weight: 500;
}

/* CARD DO FORMULÁRIO */
.form-card {
  background: #ffffff;
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 30px;
  border: 1px solid #f1f5f9;
}

.form-section { border: none; padding: 0; margin: 0; }

legend { 
  color: #2563eb !important; 
  font-weight: 700; 
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: 100%; 
  margin-bottom: 20px; 
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Linha decorativa ao lado do legend */
legend::after {
  content: "";
  height: 1px;
  background: #f1f5f9;
  flex-grow: 1;
}

.grid-row { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 20px; 
  margin-bottom: 16px; 
}

@media (max-width: 500px) { .grid-row { grid-template-columns: 1fr; } }

label { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
  color: #475569 !important; 
  font-weight: 600; 
  font-size: 0.8rem; 
}

/* INPUTS E SELECTS */
input, select {
  height: 48px;
  background-color: #f8fafc !important;
  color: #1e293b !important;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 0.95rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

input:focus, select:focus {
  outline: none;
  border-color: #2563eb;
  background-color: #ffffff !important;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.08);
}

input::placeholder { color: #94a3b8; }

/* BOTÕES */
.btn-analisar {
  background: #1e293b;
  color: white;
  padding: 18px;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-top: 10px;
}

.btn-analisar:hover:not(:disabled) { 
  background: #0f172a; 
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.btn-analisar:active { transform: translateY(0); }

.btn-limpar {
  background-color: transparent;
  color: #94a3b8;
  padding: 10px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-limpar:hover { color: #64748b; text-decoration: underline; }

/* LOADER */
.skeleton-loader {
  width: 100%;
  height: 100px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 20px;
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* RESULTADO IA */
.resultado-container {
  margin-top: 40px;
  background: #0f172a; /* Mais escuro para contraste */
  color: #e2e8f0;
  padding: 30px;
  border-radius: 24px;
  border: 1px solid #1e293b;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.res-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 24px; 
  padding-bottom: 15px;
  border-bottom: 1px solid #1e293b;
}

.res-header h3 { margin: 0; color: #60a5fa; font-size: 1.1rem; }

.btn-copy { 
  background: #1e293b; 
  color: #94a3b8; 
  border: 1px solid #334155; 
  padding: 8px 16px; 
  border-radius: 10px; 
  cursor: pointer; 
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-copy:hover { background: #334155; color: white; }

pre { 
  white-space: pre-wrap; 
  font-size: 0.95rem; 
  line-height: 1.7; 
  margin: 0; 
  font-family: 'Inter', sans-serif; 
  color: #cbd5e1;
}
/* Alinhamento dos ícones nos legends */
legend span {
  font-size: 1.2rem;
  margin-right: 4px;
}

/* Container de botões */
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.btn-analisar {
  width: 100%; /* Botão principal ocupa tudo */
}

/* Spinner real para o loader */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(37, 99, 235, 0.1);
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Melhoria no campo de observação para ocupar largura total */
.full-field {
  width: 100%;
}
</style>