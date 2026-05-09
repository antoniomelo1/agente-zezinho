import admin, { adminDb } from '../firebaseAdmin.js'

export class OcorrenciaCalendarioError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'OcorrenciaCalendarioError'
    this.statusCode = statusCode
    this.publicMessage = message
  }
}

const MOTIVOS_OCORRENCIA_CALENDARIO = new Set([
  'feriado',
  'suspensao',
  'reuniao_pedagogica',
  'evento_institucional',
  'outro'
])

const ESCOPOS_OCORRENCIA_CALENDARIO = new Set([
  'oficina',
  'institucional'
])

const STATUS_OCORRENCIA_CALENDARIO = new Set([
  'ativo',
  'cancelado'
])

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return String(valor).trim()
}

function normalizarIdentificador(valor) {
  return normalizarTexto(valor).toLowerCase()
}

function dataIsoValida(dataISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
    return false
  }

  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const data = new Date(`${dataISO}T00:00:00`)

  return (
    !Number.isNaN(data.getTime()) &&
    data.getFullYear() === ano &&
    data.getMonth() + 1 === mes &&
    data.getDate() === dia
  )
}

function normalizarDatasAfetadas(datasAfetadas) {
  if (!Array.isArray(datasAfetadas) || datasAfetadas.length === 0) {
    throw new OcorrenciaCalendarioError('datasAfetadas deve ser um array nao vazio.')
  }

  const datasNormalizadas = datasAfetadas.map(normalizarTexto).filter(Boolean)

  if (datasNormalizadas.length === 0) {
    throw new OcorrenciaCalendarioError('datasAfetadas deve conter ao menos uma data valida.')
  }

  const datasInvalidas = datasNormalizadas.filter((dataISO) => !dataIsoValida(dataISO))

  if (datasInvalidas.length > 0) {
    throw new OcorrenciaCalendarioError('datasAfetadas deve conter datas no formato YYYY-MM-DD.')
  }

  return Array.from(new Set(datasNormalizadas)).sort()
}

function validarValorConhecido({ valor, campo, permitidos }) {
  if (!permitidos.has(valor)) {
    throw new OcorrenciaCalendarioError(`${campo} informado e invalido.`)
  }
}

function montarOcorrenciaNormalizada({ payload = {}, operador = {} }) {
  const oficinaId = normalizarTexto(payload.oficinaId)
  const motivoTipo = normalizarIdentificador(payload.motivoTipo)
  const descricao = normalizarTexto(payload.descricao)
  const escopo = normalizarIdentificador(payload.escopo) || 'oficina'
  const status = normalizarIdentificador(payload.status) || 'ativo'

  if (!oficinaId) {
    throw new OcorrenciaCalendarioError('oficinaId e obrigatorio.')
  }

  const datasAfetadas = normalizarDatasAfetadas(payload.datasAfetadas)

  if (!motivoTipo) {
    throw new OcorrenciaCalendarioError('motivoTipo e obrigatorio.')
  }

  validarValorConhecido({
    valor: motivoTipo,
    campo: 'motivoTipo',
    permitidos: MOTIVOS_OCORRENCIA_CALENDARIO
  })

  if (!descricao) {
    throw new OcorrenciaCalendarioError('descricao e obrigatoria.')
  }

  validarValorConhecido({
    valor: escopo,
    campo: 'escopo',
    permitidos: ESCOPOS_OCORRENCIA_CALENDARIO
  })

  validarValorConhecido({
    valor: status,
    campo: 'status',
    permitidos: STATUS_OCORRENCIA_CALENDARIO
  })

  return {
    oficinaId,
    datasAfetadas,
    motivoTipo,
    descricao,
    escopo,
    status,
    criadoPor: operador.uid || '',
    roleCriador: operador.role || '',
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  }
}

export default async function salvarOcorrenciaCalendario({
  payload,
  operador
}) {
  const ocorrencia = montarOcorrenciaNormalizada({ payload, operador })
  const docRef = await adminDb.collection('ocorrencias_calendario').add(ocorrencia)

  return {
    id: docRef.id
  }
}
