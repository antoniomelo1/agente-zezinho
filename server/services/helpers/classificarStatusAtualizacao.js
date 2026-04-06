function normalizarParaInicioDoDia(data) {
  const dataNormalizada = new Date(data)
  dataNormalizada.setHours(0, 0, 0, 0)
  return dataNormalizada
}

const DIAS_LETIVOS_POR_OFICINA = {
  programacao: [2, 3, 4]
}

function normalizarOficinaId(oficinaId) {
  if (typeof oficinaId !== 'string') {
    return ''
  }

  return oficinaId.trim().toLowerCase()
}

function contarDiasLetivosEsperadosSemRegistro({
  dataRegistro,
  hoje,
  diasLetivosEsperados
}) {
  let totalDiasSemRegistro = 0
  const cursor = new Date(dataRegistro)
  cursor.setDate(cursor.getDate() + 1)

  while (cursor < hoje) {
    if (diasLetivosEsperados.includes(cursor.getDay())) {
      totalDiasSemRegistro += 1
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return totalDiasSemRegistro
}

export default function classificarStatusAtualizacao(dataUltimoRegistro, oficinaId = '') {
  if (!dataUltimoRegistro) {
    return 'sem_registro'
  }

  const hoje = normalizarParaInicioDoDia(new Date())
  const dataRegistro = normalizarParaInicioDoDia(new Date(`${dataUltimoRegistro}T00:00:00`))
  const oficinaNormalizada = normalizarOficinaId(oficinaId)
  const diasLetivosEsperados = DIAS_LETIVOS_POR_OFICINA[oficinaNormalizada]

  if (Array.isArray(diasLetivosEsperados) && diasLetivosEsperados.length > 0) {
    const diasLetivosSemRegistro = contarDiasLetivosEsperadosSemRegistro({
      dataRegistro,
      hoje,
      diasLetivosEsperados
    })

    if (diasLetivosSemRegistro === 0) {
      return 'atualizado'
    }

    if (diasLetivosSemRegistro === 1) {
      return 'atencao'
    }

    return 'sem_registro_recente'
  }

  const diferencaEmMs = hoje.getTime() - dataRegistro.getTime()
  const diferencaEmDias = Math.floor(diferencaEmMs / (1000 * 60 * 60 * 24))

  if (diferencaEmDias <= 3) {
    return 'atualizado'
  }

  if (diferencaEmDias <= 7) {
    return 'atencao'
  }

  return 'sem_registro_recente'
}
