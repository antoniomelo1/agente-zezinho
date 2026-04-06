<script setup>
import { auth } from '../firebase/firebase'
import { ref, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL

// ===== ESTADO DO FORMULÁRIO =====
const registro = ref({
  data: new Date().toISOString().substring(0, 10),
  modulo: '',
  tipoAula: 'aula regular',
  temaDia: '',
  temaAnterior: '',
  resumoManha: '',
  resumoTarde: '',
  softOriente: '',
  softCoracao: '',
  projetoFinal: 'não trabalhado',
  projetoHackathon: 'não iniciado',
  totalPresentesManha: '',
  totalPresentesTarde: '',
  observacoes: '',
  fotos: []
})

// ===== DIA DA SEMANA AUTOMÁTICO =====
const diaSemana = computed(() => {
  const dias = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ]
  const data = new Date(registro.value.data + 'T00:00:00')
  return dias[data.getDay()]
})

function normalizarNumeroOpcional(valor) {
  if (valor === '' || valor === null || valor === undefined) {
    return null
  }

  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

// ===== UPLOAD DE FOTOS =====
function handleFotos(event) {
  registro.value.fotos = Array.from(event.target.files)
}

// ===== SALVAR REGISTRO =====
async function salvarRegistro() {
  try {
    // validações mínimas
    if (!registro.value.modulo || !registro.value.temaDia) {
      alert('Informe o módulo e o tema da aula.')
      return
    }

    if (!registro.value.resumoManha && !registro.value.resumoTarde) {
      alert('Informe ao menos um resumo (manhã ou tarde).')
      return
    }

    const usuario = auth.currentUser

    if (!usuario) {
      alert('Usuario nao autenticado.')
      return
    }

    const token = await usuario.getIdToken()

    const response = await fetch(`${API_URL}/registros-diarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...registro.value,
        totalPresentesManha: normalizarNumeroOpcional(registro.value.totalPresentesManha),
        totalPresentesTarde: normalizarNumeroOpcional(registro.value.totalPresentesTarde)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao salvar registro.')
    }

    alert('Registro do dia salvo com sucesso!')
    limparFormulario()
  } catch (error) {
    console.error('Erro ao salvar registro:', error)
    alert('Erro ao salvar o registro. Veja o console.')
  }
}

// ===== LIMPAR FORMULÁRIO =====
function limparFormulario() {
  registro.value = {
    data: new Date().toISOString().substring(0, 10),
    modulo: '',
    tipoAula: 'aula regular',
    temaDia: '',
    temaAnterior: '',
    resumoManha: '',
    resumoTarde: '',
    softOriente: '',
    softCoracao: '',
    projetoFinal: 'não trabalhado',
    projetoHackathon: 'não iniciado',
    totalPresentesManha: '',
    totalPresentesTarde: '',
    observacoes: '',
    fotos: []
  }
}

</script>

<template>
  <section class="registro-container">

    <header class="registro-header">
      <h2>Registro Diário da Oficina de Programação</h2>
      <p>Base pedagógica para o Relatório de Execução Mensal</p>
    </header>

    <!-- IDENTIFICAÇÃO -->
    <div class="card">
      <h3>Identificação do dia</h3>
      <label>
        Módulo em estudo
        <input
          type="text"
          v-model="registro.modulo"
          placeholder="Ex: Primeiros Passos na Programação"
        />
      </label>

      <div class="grid">
        <label>
          Data da aula
          <input type="date" v-model="registro.data" />
        </label>

        <label>
          Dia da semana
          <input type="text" :value="diaSemana" disabled />
        </label>
      </div>

      <label>
        Tipo de aula
        <select v-model="registro.tipoAula">
          <option>aula regular</option>
          <option>aulão</option>
          <option>projeto</option>
          <option>hackathon</option>
        </select>
      </label>
    </div>

    <!-- CONTEXTO -->
    <div class="card">
      <h3>Contexto pedagógico</h3>

      <label>
        Tema da aula do dia
        <input
          type="text"
          v-model="registro.temaDia"
          placeholder="Ex: JavaScript – Funções e eventos"
        />
      </label>

      <label>
        Tema da aula anterior
        <input
          type="text"
          v-model="registro.temaAnterior"
          placeholder="Ex: Estrutura HTML básica"
        />
      </label>
    </div>

    <!-- MANHÃ -->
    <div class="card">
      <h3>Resumo do período da manhã</h3>
      <label>
        Presença da manhã
        <input
          type="number"
          min="0"
          v-model="registro.totalPresentesManha"
          placeholder="Quantidade de alunos presentes"
        />
      </label>
      <textarea
        v-model="registro.resumoManha"
        rows="4" 
        placeholder="Descreva o que foi trabalhado..."
      ></textarea>
    </div>

    <div class="card">
      <h3>Resumo do período da tarde</h3>
      <label>
        Presença da tarde
        <input
          type="number"
          min="0"
          v-model="registro.totalPresentesTarde"
          placeholder="Quantidade de alunos presentes"
        />
      </label>
      <textarea
        v-model="registro.resumoTarde"
        rows="4" 
        placeholder="Descreva o que foi trabalhado..."
      ></textarea>
    </div>

    <!-- SOFT SKILLS -->
    <div class="card">
      <h3>Soft skills por faixa etária</h3>

      <label>
        Oriente
        <textarea
          v-model="registro.softOriente"
          rows="4"
          placeholder="Atenção, participação, interação e postura geral do grupo."
        ></textarea>
      </label>

      <label>
        Coração
        <textarea
          v-model="registro.softCoracao"
          rows="4"
          placeholder="Autonomia, responsabilidade, comunicação e postura formativa."
        ></textarea>
      </label>
    </div>

    <!-- PROJETOS -->
    <div class="card">
      <h3>Projetos em andamento</h3>

      <label>
        Projeto final
        <select v-model="registro.projetoFinal">
          <option>não trabalhado</option>
          <option>introdução</option>
          <option>desenvolvimento</option>
          <option>ajustes</option>
          <option>finalização</option>
        </select>
      </label>

      <label>
        Projeto hackathon
        <select v-model="registro.projetoHackathon">
          <option>não iniciado</option>
          <option>preparação</option>
          <option>desenvolvimento</option>
          <option>entregue</option>
        </select>
      </label>
    </div>

    <!-- EVIDÊNCIAS OCULTO NO MOMENTO --> 
    <div v-if="false" class="card">
      <h3>Evidências do dia</h3>

      <label>Fotos</label>
      <input type="file" multiple @change="handleFotos" />
    </div>


    <!-- OBSERVAÇÕES -->
    <div class="card">
      <h3>Observações gerais</h3>
      <textarea
        v-model="registro.observacoes"
        rows="4"
        placeholder="Imprevistos, ausências..."
      ></textarea>
    </div>

    <!-- AÇÃO -->
    <div class="acoes">
      <button @click="salvarRegistro" class="btn-salvar">
        Salvar registro do dia
      </button>
    </div>

  </section>
</template>

<style scoped>
.registro-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 20px; /* Reduzi o padding superior */
}

.registro-header {
  text-align: center;
  margin-bottom: 24px;
}

.registro-header h2 {
  margin: 0;
  color: #f8fafc; /* Texto claro para o tema dark */
}

.registro-header p {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 0.9rem;
}

.card {
  background: rgba(30, 41, 59, 0.7); /* Fundo dark estilo card neon */
  padding: 20px;
  border-radius: 18px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.card h3 {
  margin-bottom: 14px;
  color: #00f2fe; /* Azul neon do Agente Zezinho */
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
}

/* PADRONIZAÇÃO DE INPUTS E SELECTS (ALTURA REDUZIDA) */
input, select {
  height: 38px; /* Altura compacta conforme pedido */
  border-radius: 10px;
  border: 1px solid #334155;
  padding: 0 12px;
  font-size: 0.85rem;
  background: #0f172a;
  color: #f8fafc;
  transition: all 0.3s ease;
}

/* PADRONIZAÇÃO DE TODOS OS TEXTAREAS */
textarea {
  min-height: 90px; /* Mesma altura para Resumos, Soft Skills e Obs */
  border-radius: 10px;
  border: 1px solid #334155;
  padding: 10px 12px;
  font-size: 0.85rem;
  background: #0f172a;
  color: #f8fafc;
  resize: vertical;
  transition: all 0.3s ease;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #00f2fe;
  box-shadow: 0 0 8px rgba(0, 242, 254, 0.2);
}

/* Estilo para o campo desabilitado (Dia da semana) */
input:disabled {
  background: rgba(15, 23, 42, 0.6);
  color: #64748b;
  cursor: not-allowed;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.acoes {
  text-align: center;
  margin-top: 25px;
}

/* BOTÃO ESTILIZADO IGUAL AO MENU */
.btn-salvar {
  background: linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%) !important;
  color: #ffffff;
  border: none;
  border-radius: 50px; /* Formato pílula igual ao cabeçalho */
  padding: 14px 40px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
  transition: all 0.3s ease;
}

.btn-salvar:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 6px 20px rgba(0, 242, 254, 0.5);
}
</style>
