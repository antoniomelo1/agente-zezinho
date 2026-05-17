import admin, { adminDb } from '../firebaseAdmin.js'
import {
  ROLES,
  isRoleCoordenadorPedagogico,
  isRoleGestorPedagogico
} from '../constants/roles.js'

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

function normalizarListaTexto(lista) {
  if (!Array.isArray(lista)) {
    return []
  }

  return lista.map(normalizarTexto).filter(Boolean)
}

function validarOperador(operador = {}) {
  if (!operador.uid || !operador.role) {
    throw new OcorrenciaCalendarioError('Usuario autenticado sem vinculo institucional valido.', 403)
  }

  if (
    ![
      ROLES.COORDENADOR_PEDAGOGICO,
      ROLES.GESTOR_PEDAGOGICO
    ].includes(operador.role)
  ) {
    throw new OcorrenciaCalendarioError('Acesso negado para este perfil.', 403)
  }
}

function normalizarOficinaPorEscopo({ oficinaId, escopo, operador }) {
  if (escopo === 'institucional') {
    if (!isRoleGestorPedagogico(operador.role)) {
      throw new OcorrenciaCalendarioError(
        'Apenas a gestao pedagogica pode criar ocorrencia institucional.',
        403
      )
    }

    return null
  }

  if (!oficinaId) {
    throw new OcorrenciaCalendarioError('oficinaId e obrigatorio para ocorrencia de oficina.')
  }

  if (isRoleCoordenadorPedagogico(operador.role)) {
    const oficinasResponsaveis = normalizarListaTexto(operador.oficinasResponsaveis)

    if (!oficinasResponsaveis.includes(oficinaId)) {
      throw new OcorrenciaCalendarioError(
        'Oficina fora do escopo de responsabilidade do coordenador pedagogico.',
        403
      )
    }
  }

  return oficinaId
}

function montarOcorrenciaNormalizada({ payload = {}, operador = {} }) {
  validarOperador(operador)

  const oficinaIdPayload = normalizarTexto(payload.oficinaId)
  const motivoTipo = normalizarIdentificador(payload.motivoTipo)
  const descricao = normalizarTexto(payload.descricao)
  const escopo = normalizarIdentificador(payload.escopo) || 'oficina'
  const status = normalizarIdentificador(payload.status) || 'ativo'

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

  const oficinaId = normalizarOficinaPorEscopo({
    oficinaId: oficinaIdPayload,
    escopo,
    operador
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

async function existeOcorrenciaAtivaDuplicada({ ocorrencia, dataAfetada }) {
  const snapshot = await adminDb
    .collection('ocorrencias_calendario')
    .where('datasAfetadas', 'array-contains', dataAfetada)
    .get()

  const ocorrenciaSobreposta = snapshot.docs.find((doc) => {
    const data = doc.data()
    const escopoExistente = data.escopo || ''

    if (data.status !== 'ativo') {
      return false
    }

    if (escopoExistente === 'institucional') {
      return true
    }

    if (ocorrencia.escopo === 'institucional') {
      return escopoExistente === 'oficina'
    }

    return (
      escopoExistente === 'oficina' &&
      data.oficinaId === ocorrencia.oficinaId
    )
  })

  if (!ocorrenciaSobreposta) {
    return null
  }

  return ocorrenciaSobreposta.data()
}

async function validarDuplicidadeAtiva(ocorrencia) {
  if (ocorrencia.status !== 'ativo') {
    return
  }

  for (const dataAfetada of ocorrencia.datasAfetadas) {
    const duplicada = await existeOcorrenciaAtivaDuplicada({
      ocorrencia,
      dataAfetada
    })

    if (!duplicada) {
      continue
    }

    if (duplicada.escopo === 'institucional') {
      throw new OcorrenciaCalendarioError(
        `Ja existe ocorrencia institucional ativa para a data ${dataAfetada}.`,
        409
      )
    }

    if (ocorrencia.escopo === 'institucional') {
      throw new OcorrenciaCalendarioError(
        `Ja existe ocorrencia de oficina ativa para a data ${dataAfetada}.`,
        409
      )
    }

    throw new OcorrenciaCalendarioError(
      `Ja existe ocorrencia ativa para esta oficina na data ${dataAfetada}.`,
      409
    )
  }
}

export default async function salvarOcorrenciaCalendario({
  payload,
  operador
}) {
  const ocorrencia = montarOcorrenciaNormalizada({ payload, operador })
  await validarDuplicidadeAtiva(ocorrencia)

  const docRef = await adminDb.collection('ocorrencias_calendario').add(ocorrencia)

  return {
    id: docRef.id
  }
}
