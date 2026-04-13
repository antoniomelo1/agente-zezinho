export function montarResumoPedagogico(registro) {
  return `
Modulo: ${registro.modulo || 'Nao informado'}
Tema da manha: ${registro.temaDiaManha || 'Nao informado'}
Tema da tarde: ${registro.temaDiaTarde || 'Nao informado'}
Tema consolidado do dia: ${registro.temaDia || 'Nao informado'}

Manha:
${registro.resumoManha || 'Sem registro.'}

Tarde:
${registro.resumoTarde || 'Sem registro.'}

Soft Skills - Oriente:
${registro.softOriente || 'Nao informado'}

Soft Skills - Coracao:
${registro.softCoracao || 'Nao informado'}
`.trim()
}

export function agruparPorSemanaPedagogica(registros) {
  const semanas = []
  let grupoAtual = {
    inicio: null,
    fim: null,
    dias: []
  }

  for (const registro of registros) {
    const data = new Date(`${registro.dataISO}T00:00:00`)
    const diaSemana = data.getDay()

    if (![2, 3, 4].includes(diaSemana)) continue

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
        dias: []
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
