import {
  OFICINA_PROGRAMACAO_ID,
  ehDiaOficialOficina,
  listarDatasOficiaisDoMes
} from './diasOficiaisOficinas.js'

export function montarResumoPedagogico(registro) {
  return `
Módulo: ${registro.modulo || 'Não informado'}
Tema da manhã: ${registro.temaDiaManha || 'Não informado'}
Tema da tarde: ${registro.temaDiaTarde || 'Não informado'}
Tema consolidado do dia: ${registro.temaDia || 'Não informado'}

Manha:
${registro.resumoManha || 'Sem registro.'}

Tarde:
${registro.resumoTarde || 'Sem registro.'}

Soft Skills - Oriente:
${registro.softOriente || 'Não informado'}

Soft Skills - Coração:
${registro.softCoracao || 'Não informado'}
`.trim()
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
    suspensao: 'suspensao de atividades',
    reuniao_pedagogica: 'reuniao pedagogica',
    evento_institucional: 'evento institucional',
    outro: 'ocorrencia institucional'
  }

  return motivos[ocorrencia.motivoTipo] || 'ocorrencia institucional'
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

  return `Observação: ${textoDatas} não houve atividades devido ao ${descricaoOcorrencia(ocorrencia)}.`
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

function montarSemanasPorCalendario({ registros, ocorrencias, ano, mes, oficinaId }) {
  const registrosPorData = new Map()

  registros.forEach((registro) => {
    if (!ehDiaOficialOficina({ dataISO: registro.dataISO, oficinaId })) {
      return
    }

    if (!registrosPorData.has(registro.dataISO)) {
      registrosPorData.set(registro.dataISO, [])
    }

    registrosPorData.get(registro.dataISO).push(registro)
  })

  const datasOficiais = listarDatasOficiaisDoMes({ ano, mes, oficinaId })
  const semanas = []
  let datasSemanaAtual = []

  datasOficiais.forEach((dataISO, index) => {
    datasSemanaAtual.push(dataISO)

    const proximaData = datasOficiais[index + 1]
    const semanaMudou =
      !proximaData ||
      new Date(`${proximaData}T00:00:00`).getDay() <
        new Date(`${dataISO}T00:00:00`).getDay()

    if (!semanaMudou) {
      return
    }

    const dias = datasSemanaAtual.flatMap((dataSemana) =>
      registrosPorData.get(dataSemana) || []
    )
    const observacoesInstitucionais = montarObservacoesInstitucionais({
      ocorrencias,
      datasSemana: datasSemanaAtual
    })

    if (dias.length > 0 || observacoesInstitucionais.length > 0) {
      const datasComConteudo = [
        ...dias.map((dia) => dia.dataISO),
        ...observacoesInstitucionais.flatMap((observacao) => observacao.datas)
      ].sort()

      semanas.push({
        inicio: datasComConteudo[0],
        fim: datasComConteudo[datasComConteudo.length - 1],
        dias,
        observacoesInstitucionais
      })
    }

    datasSemanaAtual = []
  })

  semanas.forEach((semana, index) => {
    semana.label = `Semana ${String(index + 1).padStart(2, '0')}`
  })

  return semanas
}

export function agruparPorSemanaPedagogica(
  registros,
  {
    ocorrencias = [],
    ano = null,
    mes = null,
    oficinaId = OFICINA_PROGRAMACAO_ID
  } = {}
) {
  if (ano && mes && ocorrencias.length > 0) {
    return montarSemanasPorCalendario({
      registros,
      ocorrencias,
      ano,
      mes,
      oficinaId
    })
  }

  const semanas = []
  let grupoAtual = {
    inicio: null,
    fim: null,
    dias: [],
    observacoesInstitucionais: []
  }

  for (const registro of registros) {
    if (!ehDiaOficialOficina({ dataISO: registro.dataISO, oficinaId })) continue

    if (grupoAtual.dias.length === 0) {
      grupoAtual.inicio = registro.dataISO
    }

    grupoAtual.dias.push(registro)
    grupoAtual.fim = registro.dataISO

    if (grupoAtual.dias.length === 3) {
      semanas.push({ ...grupoAtual })
      grupoAtual = {
        inicio: null,
        fim: null,
        dias: [],
        observacoesInstitucionais: []
      }
    }
  }

  if (grupoAtual.dias.length > 0) {
    semanas.push({ ...grupoAtual })
  }

  semanas.forEach((s, i) => {
    s.label = `Semana ${String(i + 1).padStart(2, '0')}`
  })

  return semanas
}

export function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

export function montarPeriodoOrdenado(inicio, fim) {
  const dataInicio = new Date(`${inicio}T00:00:00`)
  const dataFim = new Date(`${fim}T00:00:00`)

  const formatar = (data) => formatarDataBR(data)

  if (dataInicio > dataFim) {
    return `${formatar(fim)} a ${formatar(inicio)}`
  }

  return `${formatar(inicio)} a ${formatar(fim)}`
}
