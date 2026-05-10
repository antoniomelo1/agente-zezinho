export const OFICINA_PROGRAMACAO_ID = 'programacao'

export const DIAS_OFICIAIS_POR_OFICINA = {
  [OFICINA_PROGRAMACAO_ID]: [2, 3, 4]
}

export function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

export function obterDiasOficiaisOficina(oficinaId = OFICINA_PROGRAMACAO_ID) {
  return DIAS_OFICIAIS_POR_OFICINA[oficinaId] || []
}

export function ehDiaOficialOficina({
  dataISO,
  oficinaId = OFICINA_PROGRAMACAO_ID
}) {
  const diasOficiais = obterDiasOficiaisOficina(oficinaId)

  if (diasOficiais.length === 0) {
    return false
  }

  const data = new Date(`${dataISO}T00:00:00`)
  return diasOficiais.includes(data.getDay())
}

export function listarDatasOficiaisDoMes({
  ano,
  mes,
  oficinaId = OFICINA_PROGRAMACAO_ID
}) {
  const diasOficiais = obterDiasOficiaisOficina(oficinaId)
  const datas = []
  const cursor = new Date(Number(ano), Number(mes) - 1, 1)
  const fim = new Date(Number(ano), Number(mes), 0)

  while (cursor <= fim) {
    if (diasOficiais.includes(cursor.getDay())) {
      datas.push(formatarDataISO(cursor))
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return datas
}
