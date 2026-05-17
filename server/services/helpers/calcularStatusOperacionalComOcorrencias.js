import classificarStatusAtualizacao from './classificarStatusAtualizacao.js'
import { listarDatasOficiaisDoMes } from './diasOficiaisOficinas.js'

function dataISOValida(dataISO) {
  return typeof dataISO === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataISO)
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

function listarDiasOficiaisPendentes({ dataUltimoRegistro, dataReferencia, oficinaId }) {
  if (!dataISOValida(dataUltimoRegistro)) {
    return []
  }

  const inicio = new Date(`${dataUltimoRegistro}T00:00:00`)
  const fim = new Date(`${dataReferencia}T00:00:00`)

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || inicio >= fim) {
    return []
  }

  const meses = listarMesesNoIntervalo({ inicio, fim })

  return meses
    .flatMap(({ ano, mes }) =>
      listarDatasOficiaisDoMes({ ano, mes, oficinaId })
    )
    .filter((dataISO) => dataISO > dataUltimoRegistro && dataISO < dataReferencia)
    .sort()
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = String(dataISO).split('-')

  if (!ano || !mes || !dia) {
    return String(dataISO)
  }

  return `${dia}/${mes}/${ano}`
}

function montarChaveOcorrencia(ocorrencia) {
  return [
    ocorrencia.id || '',
    ocorrencia.motivoTipo || '',
    ocorrencia.descricao || '',
    ocorrencia.escopo || ''
  ].join('::')
}

function selecionarOcorrenciasJustificativas({ ocorrencias, diasJustificados }) {
  const diasJustificadosSet = new Set(diasJustificados)
  const ocorrenciasPorChave = new Map()

  ocorrencias.forEach((ocorrencia) => {
    const datas = (ocorrencia.datas || []).filter((dataISO) =>
      diasJustificadosSet.has(dataISO)
    )

    if (datas.length === 0) {
      return
    }

    const chave = montarChaveOcorrencia(ocorrencia)
    ocorrenciasPorChave.set(chave, {
      id: ocorrencia.id || '',
      datas,
      datasFormatadas: datas.map(formatarDataBR),
      motivoTipo: ocorrencia.motivoTipo || '',
      descricao: ocorrencia.descricao || '',
      escopo: ocorrencia.escopo || '',
      texto: montarTextoJustificativa(ocorrencia, datas)
    })
  })

  return Array.from(ocorrenciasPorChave.values()).sort((a, b) => {
    const dataA = a.datas[0] || ''
    const dataB = b.datas[0] || ''

    if (dataA !== dataB) {
      return dataA.localeCompare(dataB)
    }

    return a.descricao.localeCompare(b.descricao, 'pt-BR')
  })
}

function minusculaInicial(texto) {
  if (!texto) {
    return ''
  }

  return `${texto.charAt(0).toLowerCase()}${texto.slice(1)}`
}

function descricaoOcorrencia(ocorrencia) {
  const descricao = String(ocorrencia.descricao || '').trim()

  if (descricao) {
    return minusculaInicial(descricao)
  }

  const motivos = {
    feriado: 'feriado',
    suspensao: 'suspensão de atividades',
    reuniao_pedagogica: 'reunião pedagógica',
    evento_institucional: 'evento institucional',
    outro: 'ocorrência institucional'
  }

  return motivos[ocorrencia.motivoTipo] || 'ocorrência institucional'
}

function preposicaoDescricaoOcorrencia(ocorrencia) {
  const preposicoes = {
    feriado: 'por',
    suspensao: 'por',
    reuniao_pedagogica: 'por',
    evento_institucional: 'por',
    outro: 'por'
  }

  return preposicoes[ocorrencia.motivoTipo] || 'por'
}

function montarTextoDatas(datas) {
  const datasFormatadas = datas.map(formatarDataBR)

  if (datasFormatadas.length === 1) {
    return `No dia ${datasFormatadas[0]}`
  }

  const todasMesmoMesAno = datasFormatadas.every((data) =>
    data.slice(3) === datasFormatadas[0].slice(3)
  )

  if (todasMesmoMesAno) {
    const dias = datasFormatadas.map((data) => data.slice(0, 2))
    const ultimoDia = dias[dias.length - 1]
    const diasIniciais = dias.slice(0, -1).join(', ')

    return `Nos dias ${diasIniciais} e ${ultimoDia}/${datasFormatadas[0].slice(3)}`
  }

  const ultimaData = datasFormatadas[datasFormatadas.length - 1]
  const datasIniciais = datasFormatadas.slice(0, -1).join(', ')

  return `Nos dias ${datasIniciais} e ${ultimaData}`
}

function montarTextoJustificativa(ocorrencia, datas) {
  return `${montarTextoDatas(datas)} não houve atividade prevista ${preposicaoDescricaoOcorrencia(ocorrencia)} ${descricaoOcorrencia(ocorrencia)}.`
}

function classificarPorPendencias(diasPendentesSemJustificativa) {
  if (diasPendentesSemJustificativa.length === 0) {
    return 'atualizado'
  }

  if (diasPendentesSemJustificativa.length === 1) {
    return 'atencao'
  }

  return 'sem_registro_recente'
}

function montarMotivoStatus({ diasJustificados, diasPendentesSemJustificativa }) {
  if (diasJustificados.length === 0) {
    return ''
  }

  if (diasPendentesSemJustificativa.length > 0) {
    return 'Há dias oficiais justificados por ocorrência, mas ainda existem pendências sem justificativa.'
  }

  if (diasJustificados.length === 1) {
    return 'Último dia oficial sem registro foi justificado por ocorrência de calendário.'
  }

  return 'Dias oficiais sem registro foram justificados por ocorrências de calendário.'
}

export default function calcularStatusOperacionalComOcorrencias({
  dataUltimoRegistro,
  oficinaId,
  dataReferencia,
  ocorrencias = []
}) {
  const statusOriginal = classificarStatusAtualizacao(dataUltimoRegistro, oficinaId)

  if (!dataISOValida(dataUltimoRegistro) || !dataISOValida(dataReferencia)) {
    return {
      statusAtualizacao: statusOriginal,
      statusOriginal,
      possuiJustificativaOperacional: false,
      diasJustificados: [],
      diasPendentesSemJustificativa: [],
      ocorrenciasJustificativas: [],
      motivoStatus: ''
    }
  }

  const diasPendentes = listarDiasOficiaisPendentes({
    dataUltimoRegistro,
    dataReferencia,
    oficinaId
  })
  const datasOcorrenciasSet = new Set(
    ocorrencias.flatMap((ocorrencia) => ocorrencia.datas || [])
  )
  const diasJustificados = diasPendentes.filter((dataISO) =>
    datasOcorrenciasSet.has(dataISO)
  )
  const diasPendentesSemJustificativa = diasPendentes.filter(
    (dataISO) => !datasOcorrenciasSet.has(dataISO)
  )
  const possuiJustificativaOperacional = diasJustificados.length > 0
  const statusAtualizacao = possuiJustificativaOperacional
    ? classificarPorPendencias(diasPendentesSemJustificativa)
    : statusOriginal
  const ocorrenciasJustificativas = selecionarOcorrenciasJustificativas({
    ocorrencias,
    diasJustificados
  })

  return {
    statusAtualizacao,
    statusOriginal,
    possuiJustificativaOperacional,
    diasJustificados,
    diasPendentesSemJustificativa,
    ocorrenciasJustificativas,
    motivoStatus: montarMotivoStatus({
      diasJustificados,
      diasPendentesSemJustificativa
    })
  }
}
