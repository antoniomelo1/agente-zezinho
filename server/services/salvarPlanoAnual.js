import admin, { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'

export class PlanoAnualError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'PlanoAnualError'
    this.statusCode = statusCode
    this.publicMessage = message
  }
}

const TAMANHO_MAXIMO_DEFESA = 50000
const ANO_MINIMO = 2020
const ANO_MAXIMO = 2100

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

function normalizarDataFirestore(valor) {
  if (valor?.toDate) {
    return valor.toDate().toISOString()
  }

  return valor || null
}

function validarOperador(operador = {}) {
  const rolesPermitidas = [
    ROLES.COORDENADOR_PEDAGOGICO,
    ROLES.GESTOR_PEDAGOGICO
  ]

  if (!rolesPermitidas.includes(operador.role)) {
    throw new PlanoAnualError('Acesso restrito à coordenação pedagógica.', 403)
  }
}

function validarAno(ano) {
  const anoNumero = Number(ano)

  if (!ano || !Number.isInteger(anoNumero)) {
    throw new PlanoAnualError('Ano do plano anual é obrigatório.')
  }

  if (anoNumero < ANO_MINIMO || anoNumero > ANO_MAXIMO) {
    throw new PlanoAnualError('Ano do plano anual inválido.')
  }

  return anoNumero
}

function validarPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new PlanoAnualError('Dados do plano anual são obrigatórios.')
  }

  if (typeof payload.defesaProjetoAplicado !== 'string') {
    throw new PlanoAnualError('Texto do plano anual é obrigatório.')
  }

  const defesaProjetoAplicado = normalizarTexto(payload.defesaProjetoAplicado)

  if (!defesaProjetoAplicado) {
    throw new PlanoAnualError('Texto do plano anual é obrigatório.')
  }

  if (defesaProjetoAplicado.length > TAMANHO_MAXIMO_DEFESA) {
    throw new PlanoAnualError('Texto do plano anual excede o limite permitido.')
  }

  return {
    defesaProjetoAplicado
  }
}

function montarPlanoResposta(doc) {
  const data = doc.data() || {}

  return {
    ano: data.ano,
    defesaProjetoAplicado: data.defesaProjetoAplicado || '',
    atualizadoEm: normalizarDataFirestore(data.atualizadoEm),
    atualizadoPor: data.atualizadoPor || '',
    atualizadoPorNome: data.atualizadoPorNome || ''
  }
}

export default async function salvarPlanoAnual({
  ano,
  payload,
  operador
}) {
  validarOperador(operador)

  const anoNumero = validarAno(ano)
  const dadosValidados = validarPayload(payload)
  const docRef = adminDb.collection('plano_anual').doc(String(anoNumero))

  await docRef.set({
    ano: anoNumero,
    defesaProjetoAplicado: dadosValidados.defesaProjetoAplicado,
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
    atualizadoPor: operador.uid || '',
    atualizadoPorNome: operador.nome || ''
  })

  const atualizado = await docRef.get()

  return montarPlanoResposta(atualizado)
}
