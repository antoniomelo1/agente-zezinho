import { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'
import { buscarOcorrenciasCalendarioAtivasPorDatas } from './ocorrenciasCalendarioDataAccess.js'
import calcularStatusOperacionalComOcorrencias from './helpers/calcularStatusOperacionalComOcorrencias.js'
import classificarStatusAtualizacao from './helpers/classificarStatusAtualizacao.js'
import { listarDatasOficiaisDoMes } from './helpers/diasOficiaisOficinas.js'
import { resolverTemaDiaDerivado } from './helpers/resolverTemaDoRegistro.js'

function formatarDataLocalISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function normalizarDataISO(timestamp) {
  if (!timestamp?.toDate) {
    return null
  }

  return formatarDataLocalISO(timestamp.toDate())
}

function normalizarTexto(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function normalizarDataFiltro(value) {
  const dataTexto = normalizarTexto(value)

  if (!dataTexto) {
    return ''
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)) {
    return ''
  }

  const data = new Date(`${dataTexto}T00:00:00`)

  if (Number.isNaN(data.getTime())) {
    return ''
  }

  return dataTexto
}

function respostaVazia({ detalharHistorico }) {
  return {
    geradoEm: new Date().toISOString(),
    oficinas: [],
    educadores: [],
    ...(detalharHistorico ? { historicoRegistros: [] } : {})
  }
}

function normalizarListaTextos(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(normalizarTexto)
    .filter(Boolean)
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

function oficinaEstaPermitida(oficinaId, oficinasPermitidas) {
  if (oficinasPermitidas === null) {
    return true
  }

  return oficinasPermitidas.includes(normalizarTexto(oficinaId))
}

function listarMesesNoIntervalo({ inicio, fim }) {
  const meses = []
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const limite = new Date(fim.getFullYear(), fim.getMonth(), 1)

  while (cursor <= limite) {
    meses.push({
      ano: cursor.getFullYear(),
      mes: cursor.getMonth() + 1
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  return meses
}

function listarDatasOficiaisPendentesParaBusca({
  dataUltimoRegistro,
  dataReferencia,
  oficinaId
}) {
  if (!dataUltimoRegistro || !dataReferencia) {
    return []
  }

  const inicio = new Date(`${dataUltimoRegistro}T00:00:00`)
  const fim = new Date(`${dataReferencia}T00:00:00`)

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio >= fim) {
    return []
  }

  return listarMesesNoIntervalo({ inicio, fim })
    .flatMap(({ ano, mes }) =>
      listarDatasOficiaisDoMes({ ano, mes, oficinaId })
    )
    .filter((dataISO) => dataISO > dataUltimoRegistro && dataISO < dataReferencia)
    .sort()
}

function montarRegistroHistorico(doc) {
  const dadosRegistro = doc.data()

  return {
    id: doc.id,
    dataRegistro: normalizarDataISO(dadosRegistro.data),
    temaDia: resolverTemaDiaDerivado(dadosRegistro),
    tipoAula: dadosRegistro.tipoAula || '',
    modulo: dadosRegistro.modulo || '',
    resumoManha: dadosRegistro.resumoManha || '',
    resumoTarde: dadosRegistro.resumoTarde || '',
    totalPresentesManha: dadosRegistro.totalPresentesManha ?? null,
    totalPresentesTarde: dadosRegistro.totalPresentesTarde ?? null,
    totalPresentes: dadosRegistro.totalPresentes ?? null
  }
}

async function listarHistoricoEducador({ educadorId, oficinaId, data }) {
  const dataFiltro = normalizarDataFiltro(data)

  const snapshot = await adminDb
    .collection('registros_diarios')
    .where('uidEducador', '==', educadorId)
    .where('excluido', '==', false)
    .orderBy('data', 'desc')
    .get()

  const registrosFiltrados = snapshot.docs.filter((doc) => {
    const dadosRegistro = doc.data()
    const dataRegistro = normalizarDataISO(dadosRegistro.data)

    if ((dadosRegistro.oficinaId || '') !== oficinaId) {
      return false
    }

    if (dataFiltro && dataRegistro !== dataFiltro) {
      return false
    }

    return true
  })

  return registrosFiltrados
    .slice(0, dataFiltro ? 1 : 3)
    .map(montarRegistroHistorico)
}

function montarLeituraEducador(educador, registroSnap) {
  if (!registroSnap?.exists) {
    return {
      uidEducador: educador.uid,
      nomeEducador: educador.nome,
      oficinaId: educador.oficinaId || '',
      dataUltimoRegistro: null,
      temaDia: '',
      modulo: '',
      tipoAula: '',
      totalPresentesManha: null,
      totalPresentesTarde: null,
      totalPresentes: null,
      statusAtualizacao: 'sem_registro',
      statusOriginal: 'sem_registro',
      possuiJustificativaOperacional: false,
      diasJustificados: [],
      diasPendentesSemJustificativa: [],
      ocorrenciasJustificativas: [],
      motivoStatus: '',
      temRegistro: false
    }
  }

  const dadosRegistro = registroSnap.data()
  const dataUltimoRegistro = normalizarDataISO(dadosRegistro.data)
  const oficinaId = dadosRegistro.oficinaId || educador.oficinaId || ''
  const statusAtualizacao = classificarStatusAtualizacao(
    dataUltimoRegistro,
    oficinaId
  )

  return {
    uidEducador: educador.uid,
    nomeEducador: dadosRegistro.nomeEducador || educador.nome,
    oficinaId,
    dataUltimoRegistro,
    temaDia: resolverTemaDiaDerivado(dadosRegistro),
    modulo: dadosRegistro.modulo || '',
    tipoAula: dadosRegistro.tipoAula || '',
    totalPresentesManha: dadosRegistro.totalPresentesManha ?? null,
    totalPresentesTarde: dadosRegistro.totalPresentesTarde ?? null,
    totalPresentes: dadosRegistro.totalPresentes ?? null,
    statusAtualizacao,
    statusOriginal: statusAtualizacao,
    possuiJustificativaOperacional: false,
    diasJustificados: [],
    diasPendentesSemJustificativa: [],
    ocorrenciasJustificativas: [],
    motivoStatus: '',
    temRegistro: true
  }
}

async function aplicarJustificativasOperacionais(item, dataReferencia) {
  const datasOficiaisPendentes = listarDatasOficiaisPendentesParaBusca({
    dataUltimoRegistro: item.dataUltimoRegistro,
    dataReferencia,
    oficinaId: item.oficinaId
  })

  if (datasOficiaisPendentes.length === 0) {
    return {
      ...item,
      diasPendentesSemJustificativa: []
    }
  }

  const ocorrencias = await buscarOcorrenciasCalendarioAtivasPorDatas({
    datasOficiais: datasOficiaisPendentes,
    oficinaId: item.oficinaId
  })
  const statusComOcorrencias = calcularStatusOperacionalComOcorrencias({
    dataUltimoRegistro: item.dataUltimoRegistro,
    oficinaId: item.oficinaId,
    dataReferencia,
    ocorrencias
  })

  return {
    ...item,
    ...statusComOcorrencias
  }
}

async function consolidarOficinas(leituraEducadores, dataReferencia) {
  const oficinasMap = new Map()

  for (const educador of leituraEducadores) {
    const oficinaId = educador.oficinaId || 'sem_oficina'

    if (!oficinasMap.has(oficinaId)) {
      oficinasMap.set(oficinaId, {
        oficinaId,
        dataUltimoRegistro: null,
        statusAtualizacao: 'sem_registro',
        totalEducadores: 0,
        educadoresComRegistro: 0,
        educadoresSemRegistro: 0
      })
    }

    const oficina = oficinasMap.get(oficinaId)
    oficina.totalEducadores += 1

    if (educador.temRegistro) {
      oficina.educadoresComRegistro += 1

      if (
        !oficina.dataUltimoRegistro ||
        educador.dataUltimoRegistro > oficina.dataUltimoRegistro
      ) {
        oficina.dataUltimoRegistro = educador.dataUltimoRegistro
      }
    } else {
      oficina.educadoresSemRegistro += 1
    }

  }

  const oficinas = await Promise.all(
    Array.from(oficinasMap.values()).map((oficina) => {
      const statusAtualizacao = classificarStatusAtualizacao(
        oficina.dataUltimoRegistro,
        oficina.oficinaId
      )

      return aplicarJustificativasOperacionais(
        {
          ...oficina,
          statusAtualizacao,
          statusOriginal: statusAtualizacao,
          possuiJustificativaOperacional: false,
          diasJustificados: [],
          diasPendentesSemJustificativa: [],
          ocorrenciasJustificativas: [],
          motivoStatus: ''
        },
        dataReferencia
      )
    })
  )

  return oficinas.sort((a, b) => a.oficinaId.localeCompare(b.oficinaId, 'pt-BR'))
}

export default async function listarLeituraOperacionalCoordenador(filtros = {}) {
  const oficinaIdFiltro = normalizarTexto(filtros.oficinaId)
  const educadorIdFiltro = normalizarTexto(filtros.educadorId)
  const dataFiltro = normalizarDataFiltro(filtros.data)
  const detalharHistorico = Boolean(oficinaIdFiltro && educadorIdFiltro)
  const dataReferencia = formatarDataLocalISO(new Date())
  const oficinasPermitidas = resolverOficinasPermitidas(filtros.operador)

  if (
    Array.isArray(oficinasPermitidas) &&
    oficinasPermitidas.length === 0
  ) {
    return respostaVazia({ detalharHistorico })
  }

  if (
    oficinaIdFiltro &&
    !oficinaEstaPermitida(oficinaIdFiltro, oficinasPermitidas)
  ) {
    return respostaVazia({ detalharHistorico })
  }

  const educadoresSnapshot = await adminDb
    .collection('usuarios')
    .where('role', '==', ROLES.EDUCADOR)
    .where('ativo', '==', true)
    .get()

  const educadores = educadoresSnapshot.docs
    .map((doc) => {
      const data = doc.data()

      return {
        uid: data.uid || doc.id,
        nome: data.nome || '',
        oficinaId: data.oficinaId || ''
      }
    })
    .filter((educador) =>
      oficinaEstaPermitida(educador.oficinaId, oficinasPermitidas)
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  if (
    educadorIdFiltro &&
    !educadores.some((educador) => educador.uid === educadorIdFiltro)
  ) {
    return respostaVazia({ detalharHistorico })
  }

  if (
    detalharHistorico &&
    !educadores.some(
      (educador) =>
        educador.uid === educadorIdFiltro &&
        educador.oficinaId === oficinaIdFiltro
    )
  ) {
    return respostaVazia({ detalharHistorico })
  }

  const registrosRecentes = await Promise.all(
    educadores.map((educador) =>
      adminDb
        .collection('registros_diarios')
        .where('uidEducador', '==', educador.uid)
        .where('excluido', '==', false)
        .orderBy('data', 'desc')
        .limit(1)
        .get()
    )
  )

  const leituraEducadoresBase = educadores.map((educador, index) =>
    montarLeituraEducador(educador, registrosRecentes[index].docs[0] || null)
  )
  const leituraEducadores = await Promise.all(
    leituraEducadoresBase.map((educador) =>
      aplicarJustificativasOperacionais(educador, dataReferencia)
    )
  )

  const resposta = {
    geradoEm: new Date().toISOString(),
    oficinas: await consolidarOficinas(leituraEducadores, dataReferencia),
    educadores: leituraEducadores
  }

  if (detalharHistorico) {
    resposta.historicoRegistros = await listarHistoricoEducador({
      educadorId: educadorIdFiltro,
      oficinaId: oficinaIdFiltro,
      data: dataFiltro
    })
  }

  return resposta
}
