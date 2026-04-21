<script setup>
import { auth } from '../firebase/firebase'
import { ref, computed } from 'vue'

const API_URL = import.meta.env.VITE_API_URL

function gerarDataLocalInput(data = new Date()) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

const estadoInicialRegistro = () => ({
  data: gerarDataLocalInput(),
  modulo: '',
  tipoAula: 'aula regular',
  temaDia: '',
  temaDiaManha: '',
  temaDiaTarde: '',
  temaTardeDiferente: false,
  temaAnterior: '',
  resumoManha: '',
  resumoTarde: '',
  softOriente: '',
  softCoracao: '',
  projetoFinal: 'nao trabalhado',
  projetoHackathon: 'nao iniciado',
  totalPresentesManha: '',
  totalPresentesTarde: '',
  observacoes: '',
  fotos: []
})

const registro = ref(estadoInicialRegistro())

const diaSemana = computed(() => {
  const dias = [
    'Domingo',
    'Segunda-feira',
    'Terca-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sabado'
  ]
  const data = new Date(`${registro.value.data}T00:00:00`)

  return dias[data.getDay()]
})

function normalizarNumeroOpcional(valor) {
  if (valor === '' || valor === null || valor === undefined) {
    return null
  }

  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function normalizarTextoOpcional(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

function obterTemaDiaCompatibilidade() {
  const temaManha = normalizarTextoOpcional(registro.value.temaDiaManha)
  const temaTarde = normalizarTextoOpcional(registro.value.temaDiaTarde)

  if (temaManha && temaTarde) {
    return `${temaManha} / ${temaTarde}`
  }

  return temaManha || temaTarde || normalizarTextoOpcional(registro.value.temaDia)
}

function handleFotos(event) {
  registro.value.fotos = Array.from(event.target.files)
}

function alternarTemaTardeDiferente() {
  if (!registro.value.temaTardeDiferente) {
    registro.value.temaDiaTarde = ''
  }
}

async function salvarRegistro() {
  try {
    const temaDiaCompatibilidade = obterTemaDiaCompatibilidade()

    if (!registro.value.modulo || !temaDiaCompatibilidade) {
      alert('Informe o módulo e ao menos um tema da aula.')
      return
    }

    if (!registro.value.resumoManha && !registro.value.resumoTarde) {
      alert('Informe ao menos um resumo (manhã ou tarde).')
      return
    }

    const usuario = auth.currentUser

    if (!usuario) {
      alert('Usuário não autenticado.')
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
        temaDia: temaDiaCompatibilidade,
        temaDiaManha: normalizarTextoOpcional(registro.value.temaDiaManha),
        temaDiaTarde: registro.value.temaTardeDiferente
          ? normalizarTextoOpcional(registro.value.temaDiaTarde)
          : null,
        totalPresentesManha: normalizarNumeroOpcional(registro.value.totalPresentesManha),
        totalPresentesTarde: normalizarNumeroOpcional(registro.value.totalPresentesTarde)
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao salvar o registro.')
    }

    alert('Registro do dia salvo com sucesso!')
    limparFormulario()
  } catch (error) {
    console.error('Erro ao salvar registro:', error)
    alert('Erro ao salvar o registro. Verifique o console.')
  }
}

function limparFormulario() {
  registro.value = estadoInicialRegistro()
}
</script>

<template>
  <section class="registro-container">
    <header class="registro-header">
      <h2>Registro diário da Oficina de Programação</h2>
      <p>Base pedagógica para o Relatório de Execução Mensal</p>
    </header>

    <div class="card">
      <h3>Identificação do dia</h3>
      <label>
        Módulo em estudo
        <input
          v-model="registro.modulo"
          type="text"
          placeholder="Ex: Primeiros Passos na Programação"
        />
      </label>

      <div class="grid">
        <label>
          Data da aula
          <input v-model="registro.data" type="date" />
        </label>

        <label>
          Dia da semana
          <input :value="diaSemana" type="text" disabled />
        </label>
      </div>

      <label>
        Tipo de aula
        <select v-model="registro.tipoAula">
          <option>aula regular</option>
          <option>aulao</option>
          <option>projeto</option>
          <option>hackathon</option>
        </select>
      </label>
    </div>

    <div class="card">
      <h3>Contexto pedagógico</h3>

      <label>
        Tema da aula da manhã
        <input
          v-model="registro.temaDiaManha"
          type="text"
          placeholder="Ex: JavaScript - Funções e eventos"
        />
      </label>

      <label class="checkbox-label">
        <input
          v-model="registro.temaTardeDiferente"
          type="checkbox"
          @change="alternarTemaTardeDiferente"
        />
        <span>Tema diferente no período da tarde</span>
      </label>

      <label v-if="registro.temaTardeDiferente">
        Tema da aula da tarde
        <input
          v-model="registro.temaDiaTarde"
          type="text"
          placeholder="Ex: Scratch - Variáveis e condições"
        />
      </label>

      <label>
        Tema da aula anterior
        <input
          v-model="registro.temaAnterior"
          type="text"
          placeholder="Ex: Estrutura HTML básica"
        />
      </label>
    </div>

    <div class="card">
      <h3>Resumo do período da manhã</h3>
      <label>
        Presença da manhã
        <input
          v-model="registro.totalPresentesManha"
          type="number"
          min="0"
          placeholder="Quantidade de participantes presentes"
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
          v-model="registro.totalPresentesTarde"
          type="number"
          min="0"
          placeholder="Quantidade de participantes presentes"
        />
      </label>
      <textarea
        v-model="registro.resumoTarde"
        rows="4"
        placeholder="Descreva o que foi trabalhado..."
      ></textarea>
    </div>

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
        Coracao
        <textarea
          v-model="registro.softCoracao"
          rows="4"
          placeholder="Autonomia, responsabilidade, comunicação e postura formativa."
        ></textarea>
      </label>
    </div>

    <div class="card">
      <h3>Projetos em andamento</h3>

      <label>
        Projeto final
        <select v-model="registro.projetoFinal">
          <option>nao trabalhado</option>
          <option>introducao</option>
          <option>desenvolvimento</option>
          <option>ajustes</option>
          <option>finalizacao</option>
        </select>
      </label>

      <label>
        Projeto hackathon
        <select v-model="registro.projetoHackathon">
          <option>nao iniciado</option>
          <option>preparacao</option>
          <option>desenvolvimento</option>
          <option>entregue</option>
        </select>
      </label>
    </div>

    <div v-if="false" class="card">
      <h3>Evidências do dia</h3>

      <label>Fotos</label>
      <input type="file" multiple @change="handleFotos" />
    </div>

    <div class="card">
      <h3>Observações gerais</h3>
      <textarea
        v-model="registro.observacoes"
        rows="4"
        placeholder="Imprevistos, ausências..."
      ></textarea>
    </div>

    <div class="acoes">
      <button class="btn-salvar" @click="salvarRegistro">
        Salvar registro do dia
      </button>
    </div>
  </section>
</template>

<style scoped>
.registro-container {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px;
}

.registro-header {
  text-align: center;
  margin-bottom: 30px;
}

.registro-header h2 {
  margin: 0;
  color: #f8fafc;
}

.registro-header p {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 0.9rem;
}

.card {
  background: rgba(15, 23, 42, 0.9);
  padding: 24px;
  border-radius: 20px;
  margin-bottom: 22px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 22px 48px rgba(2, 6, 23, 0.35);
  backdrop-filter: blur(16px);
}

.card h3 {
  margin-bottom: 14px;
  color: #00f2fe;
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

input,
select {
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 10px 14px;
  font-size: 0.95rem;
  background: rgba(2, 6, 23, 0.55);
  color: #f8fafc;
  transition: all 0.3s ease;
}

textarea {
  min-height: 140px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 14px 16px;
  font-size: 0.95rem;
  background: rgba(2, 6, 23, 0.55);
  color: #f8fafc;
  resize: vertical;
  transition: all 0.3s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #00f2fe;
  box-shadow: 0 0 8px rgba(0, 242, 254, 0.2);
}

input:disabled {
  background: rgba(15, 23, 42, 0.6);
  color: #64748b;
  cursor: not-allowed;
}

.checkbox-label {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
}

.checkbox-label span {
  color: #cbd5e1;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .registro-container {
    padding: 24px 0;
  }

  .card {
    padding: 20px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

.acoes {
  text-align: center;
  margin-top: 25px;
}

.btn-salvar {
  background: linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%) !important;
  color: #ffffff;
  border: none;
  border-radius: 50px;
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
