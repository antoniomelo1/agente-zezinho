import {
  OFICINA_PROGRAMACAO_ID,
  listarDatasOficiaisDoMes
} from './diasOficiaisOficinas.js'

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = String(dataISO).split('-')
  return `${dia}/${mes}/${ano}`
}

function montarPeriodoSemana(datas) {
  const primeira = datas[0]
  const ultima = datas[datas.length - 1]

  if (!primeira || !ultima) {
    return ''
  }

  if (primeira.dataISO === ultima.dataISO) {
    return formatarDataBR(primeira.dataISO)
  }

  return `${formatarDataBR(primeira.dataISO)} a ${formatarDataBR(ultima.dataISO)}`
}

function obterDiaSemanaLabel(diaSemana) {
  if (diaSemana === 2) {
    return 'Terca-feira'
  }

  if (diaSemana === 3) {
    return 'Quarta-feira'
  }

  return 'Quinta-feira'
}

function montarChaveObservacao(ocorrencia) {
  return [
    ocorrencia.motivoTipo || '',
    ocorrencia.descricao || '',
    ocorrencia.escopo || ''
  ].join('::')
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
    feriado: 'ao',
    suspensao: 'à',
    reuniao_pedagogica: 'à',
    evento_institucional: 'ao',
    outro: 'à'
  }

  return preposicoes[ocorrencia.motivoTipo] || 'à'
}

function formatarDatasObservacao(datas) {
  const datasFormatadas = datas.map(formatarDataBR)

  if (datasFormatadas.length === 1) {
    return {
      datasFormatadas,
      textoDatas: `No dia ${datasFormatadas[0]}`
    }
  }

  const todasMesmoMesAno = datasFormatadas.every((data) =>
    data.slice(3) === datasFormatadas[0].slice(3)
  )

  if (todasMesmoMesAno) {
    const dias = datasFormatadas.map((data) => data.slice(0, 2))
    const ultimoDia = dias[dias.length - 1]
    const diasIniciais = dias.slice(0, -1).join(', ')

    return {
      datasFormatadas,
      textoDatas: `Nos dias ${diasIniciais} e ${ultimoDia}/${datasFormatadas[0].slice(3)}`
    }
  }

  const ultimaData = datasFormatadas[datasFormatadas.length - 1]
  const datasIniciais = datasFormatadas.slice(0, -1).join(', ')

  return {
    datasFormatadas,
    textoDatas: `Nos dias ${datasIniciais} e ${ultimaData}`
  }
}

function montarTextoObservacao(ocorrencia, datas) {
  const { textoDatas } = formatarDatasObservacao(datas)

  return `Observação: ${textoDatas} não haverá atividades devido ${preposicaoDescricaoOcorrencia(ocorrencia)} ${descricaoOcorrencia(ocorrencia)}.`
}

function montarObservacoesInstitucionais({ ocorrencias, datasSemana }) {
  const datasSemanaSet = new Set(datasSemana)
  const observacoesPorChave = new Map()

  ocorrencias.forEach((ocorrencia) => {
    const datasDaSemana = ocorrencia.datas.filter((dataISO) =>
      datasSemanaSet.has(dataISO)
    )

    if (datasDaSemana.length === 0) {
      return
    }

    const chave = montarChaveObservacao(ocorrencia)
    const observacaoAtual = observacoesPorChave.get(chave) || {
      motivoTipo: ocorrencia.motivoTipo,
      descricao: ocorrencia.descricao,
      escopo: ocorrencia.escopo,
      datas: new Set()
    }

    datasDaSemana.forEach((dataISO) => observacaoAtual.datas.add(dataISO))
    observacoesPorChave.set(chave, observacaoAtual)
  })

  return Array.from(observacoesPorChave.values())
    .map((observacao) => {
      const datas = Array.from(observacao.datas).sort()
      const { datasFormatadas } = formatarDatasObservacao(datas)

      return {
        datas,
        datasFormatadas,
        motivoTipo: observacao.motivoTipo,
        descricao: observacao.descricao,
        escopo: observacao.escopo,
        texto: montarTextoObservacao(observacao, datas)
      }
    })
    .sort((a, b) => a.datas[0].localeCompare(b.datas[0]))
}

export default function gerarCalendarioPlanoAulasMensal({
  ano,
  mes,
  oficinaId = OFICINA_PROGRAMACAO_ID,
  ocorrencias = []
}) {
  const datasPlanejadas = listarDatasOficiaisDoMes({ ano, mes, oficinaId })
    .map((dataISO) => {
      const diaSemana = new Date(`${dataISO}T00:00:00`).getDay()

      return {
        dataISO,
        diaSemana,
        diaSemanaLabel: obterDiaSemanaLabel(diaSemana)
      }
    })

  const semanas = []
  let semanaAtual = []

  datasPlanejadas.forEach((dataPlanejada, index) => {
    semanaAtual.push(dataPlanejada)

    const proximaData = datasPlanejadas[index + 1]
    const semanaMudou =
      !proximaData ||
      new Date(`${proximaData.dataISO}T00:00:00`).getDay() <
        new Date(`${dataPlanejada.dataISO}T00:00:00`).getDay()

    if (semanaMudou) {
      const datasSemana = semanaAtual.map((dataPlanejada) => dataPlanejada.dataISO)
      const observacoesInstitucionais = montarObservacoesInstitucionais({
        ocorrencias,
        datasSemana
      })
      const datasComOcorrencia = new Set(
        observacoesInstitucionais.flatMap((observacao) => observacao.datas)
      )
      const dias = semanaAtual.filter(
        (dataPlanejada) => !datasComOcorrencia.has(dataPlanejada.dataISO)
      )
      const periodo = dias.length > 0
        ? montarPeriodoSemana(dias)
        : 'Sem atividades planejadas'

      semanas.push({
        identificacao: `Semana ${String(semanas.length + 1).padStart(2, '0')}`,
        periodo,
        dias,
        observacoesInstitucionais
      })

      semanaAtual = []
    }
  })

  return semanas
}
