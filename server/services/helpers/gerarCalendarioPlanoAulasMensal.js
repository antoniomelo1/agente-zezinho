function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = String(dataISO).split('-')
  return `${dia}-${mes}-${ano}`
}

function montarPeriodoSemana(datas) {
  const primeira = datas[0]
  const ultima = datas[datas.length - 1]

  return `${formatarDataBR(primeira.dataISO)} a ${formatarDataBR(ultima.dataISO)}`
}

export default function gerarCalendarioPlanoAulasMensal({ ano, mes }) {
  const datasPlanejadas = []
  const dataCursor = new Date(ano, mes - 1, 1)
  const dataFim = new Date(ano, mes, 0)

  while (dataCursor <= dataFim) {
    const diaSemana = dataCursor.getDay()

    if (diaSemana === 2 || diaSemana === 3 || diaSemana === 4) {
      datasPlanejadas.push({
        dataISO: formatarDataISO(dataCursor),
        diaSemana,
        diaSemanaLabel:
          diaSemana === 2
            ? 'Terca-feira'
            : diaSemana === 3
              ? 'Quarta-feira'
              : 'Quinta-feira'
      })
    }

    dataCursor.setDate(dataCursor.getDate() + 1)
  }

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
      semanas.push({
        identificacao: `Semana ${String(semanas.length + 1).padStart(2, '0')}`,
        periodo: montarPeriodoSemana(semanaAtual),
        dias: semanaAtual
      })

      semanaAtual = []
    }
  })

  return semanas
}
