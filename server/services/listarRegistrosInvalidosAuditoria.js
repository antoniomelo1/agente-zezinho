import admin, { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'

const LIMITE_PADRAO = 50
const LIMITE_MAXIMO = 100
const TAMANHO_MAXIMO_IN = 10

export class AuditoriaRegistrosInvalidosError extends Error {
  constructor(publicMessage, statusCode = 400) {
    super(publicMessage)
    this.name = 'AuditoriaRegistrosInvalidosError'
    this.publicMessage = publicMessage
    this.statusCode = statusCode
  }
}

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return String(valor).trim()
}

function normalizarListaTextos(valor) {
  if (!Array.isArray(valor)) {
    return []
  }

  return valor.map(normalizarTexto).filter(Boolean)
}

function resolverLimite(valor) {
  const texto = normalizarTexto(valor)

  if (!texto) {
    return LIMITE_PADRAO
  }

  const limite = Number(texto)

  if (!Number.isInteger(limite) || limite <= 0) {
    throw new AuditoriaRegistrosInvalidosError('Limite de auditoria inválido.')
  }

  return Math.min(limite, LIMITE_MAXIMO)
}

function resolverDataFiltro(valor, campo) {
  const texto = normalizarTexto(valor)

  if (!texto) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new AuditoriaRegistrosInvalidosError(`${campo} inválida.`)
  }

  const data = new Date(`${texto}T00:00:00`)

  if (Number.isNaN(data.getTime())) {
    throw new AuditoriaRegistrosInvalidosError(`${campo} inválida.`)
  }

  return data
}

function resolverDataFimExclusiva(dataFim) {
  if (!dataFim) {
    return null
  }

  const dataFimExclusiva = new Date(dataFim)
  dataFimExclusiva.setDate(dataFimExclusiva.getDate() + 1)

  return dataFimExclusiva
}

function resolverOficinasPermitidas(operador = {}) {
  if (operador.role === ROLES.GESTOR_PEDAGOGICO) {
    return null
  }

  if (operador.role !== ROLES.COORDENADOR_PEDAGOGICO) {
    return []
  }

  return normalizarListaTextos(operador.oficinasResponsaveis)
}

function resolverOficinasConsulta({ oficinaIdFiltro, oficinasPermitidas }) {
  if (oficinasPermitidas === null) {
    return oficinaIdFiltro ? [oficinaIdFiltro] : null
  }

  if (oficinaIdFiltro) {
    if (!oficinasPermitidas.includes(oficinaIdFiltro)) {
      throw new AuditoriaRegistrosInvalidosError(
        'Oficina fora do escopo institucional do coordenador pedagógico.',
        403
      )
    }

    return [oficinaIdFiltro]
  }

  return oficinasPermitidas
}

function dividirEmLotes(lista, tamanho) {
  const lotes = []

  for (let indice = 0; indice < lista.length; indice += tamanho) {
    lotes.push(lista.slice(indice, indice + tamanho))
  }

  return lotes
}

function timestampParaData(valor) {
  if (!valor?.toDate) {
    return null
  }

  return valor.toDate()
}

function formatarDataISO(valor) {
  const data = timestampParaData(valor)

  if (!data) {
    return null
  }

  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function formatarDataPtBr(valor) {
  const data = timestampParaData(valor)

  if (!data) {
    return 'Não informado'
  }

  return data.toLocaleDateString('pt-BR')
}

function formatarDataHoraPtBr(valor) {
  const data = timestampParaData(valor)

  if (!data) {
    return 'Não informado'
  }

  return data.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  })
}

function timestampParaIso(valor) {
  const data = timestampParaData(valor)
  return data ? data.toISOString() : null
}

function timestampParaMillis(valor) {
  const data = timestampParaData(valor)
  return data ? data.getTime() : 0
}

function montarQueryBase({ uidEducador, dataInicio, dataFimExclusiva, limite }) {
  let query = adminDb
    .collection('registros_diarios')
    .where('excluido', '==', true)

  if (uidEducador) {
    query = query.where('uidEducador', '==', uidEducador)
  }

  if (dataInicio) {
    query = query.where('data', '>=', admin.firestore.Timestamp.fromDate(dataInicio))
  }

  if (dataFimExclusiva) {
    query = query.where('data', '<', admin.firestore.Timestamp.fromDate(dataFimExclusiva))
  }

  query = dataInicio || dataFimExclusiva
    ? query.orderBy('data', 'desc')
    : query.orderBy('excluidoEm', 'desc')

  return query.limit(limite)
}

async function buscarRegistros({
  oficinasConsulta,
  uidEducador,
  dataInicio,
  dataFimExclusiva,
  limite
}) {
  const queryBase = montarQueryBase({
    uidEducador,
    dataInicio,
    dataFimExclusiva,
    limite
  })

  if (oficinasConsulta === null) {
    const snapshot = await queryBase.get()
    return snapshot.docs
  }

  if (oficinasConsulta.length === 0) {
    return []
  }

  const lotes = dividirEmLotes(oficinasConsulta, TAMANHO_MAXIMO_IN)
  const snapshots = await Promise.all(
    lotes.map((lote) => {
      const query = lote.length === 1
        ? queryBase.where('oficinaId', '==', lote[0])
        : queryBase.where('oficinaId', 'in', lote)

      return query.get()
    })
  )

  const docsPorId = new Map()

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      docsPorId.set(doc.id, doc)
    })
  })

  return Array.from(docsPorId.values())
}

function mapearRegistroAuditoria(doc) {
  const data = doc.data() || {}

  return {
    id: doc.id,
    dataRegistro: formatarDataISO(data.data),
    dataRegistroFormatada: formatarDataPtBr(data.data),
    oficinaId: data.oficinaId || null,
    nomeOficina: null,
    uidEducador: data.uidEducador || null,
    nomeEducador: data.nomeEducador || 'Não informado',
    excluidoEm: timestampParaIso(data.excluidoEm),
    excluidoEmFormatado: formatarDataHoraPtBr(data.excluidoEm),
    excluidoPor: data.excluidoPor || null,
    nomeExcluidoPor: normalizarTexto(data.nomeExcluidoPor) || 'Não informado',
    motivoExclusao: normalizarTexto(data.motivoExclusao) || 'Não informado',
    statusInstitucional: 'invalidado'
  }
}

export default async function listarRegistrosInvalidosAuditoria({
  operador,
  filtros = {}
} = {}) {
  const limite = resolverLimite(filtros.limite)
  const oficinaIdFiltro = normalizarTexto(filtros.oficinaId)
  const uidEducador = normalizarTexto(filtros.uidEducador)
  const dataInicio = resolverDataFiltro(filtros.dataInicio, 'Data inicial')
  const dataFim = resolverDataFiltro(filtros.dataFim, 'Data final')
  const dataFimExclusiva = resolverDataFimExclusiva(dataFim)

  if (dataInicio && dataFim && dataInicio > dataFim) {
    throw new AuditoriaRegistrosInvalidosError(
      'Data inicial não pode ser posterior à data final.'
    )
  }

  const oficinasPermitidas = resolverOficinasPermitidas(operador)
  const oficinasConsulta = resolverOficinasConsulta({
    oficinaIdFiltro,
    oficinasPermitidas
  })

  const docs = await buscarRegistros({
    oficinasConsulta,
    uidEducador,
    dataInicio,
    dataFimExclusiva,
    limite
  })

  const registros = docs
    .sort((a, b) => {
      const excluidoEmB = timestampParaMillis(b.data()?.excluidoEm)
      const excluidoEmA = timestampParaMillis(a.data()?.excluidoEm)

      if (excluidoEmB !== excluidoEmA) {
        return excluidoEmB - excluidoEmA
      }

      return timestampParaMillis(b.data()?.data) - timestampParaMillis(a.data()?.data)
    })
    .slice(0, limite)
    .map(mapearRegistroAuditoria)

  return {
    registros,
    limite,
    totalRetornado: registros.length
  }
}
