function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

export function resolverTemaDiaDerivado({
  temaDiaManha,
  temaDiaTarde,
  temaDia
} = {}) {
  const temaManhaNormalizado = normalizarTexto(temaDiaManha)
  const temaTardeNormalizado = normalizarTexto(temaDiaTarde)
  const temaLegadoNormalizado = normalizarTexto(temaDia)

  if (temaManhaNormalizado && temaTardeNormalizado) {
    return `${temaManhaNormalizado} / ${temaTardeNormalizado}`
  }

  if (temaManhaNormalizado) {
    return temaManhaNormalizado
  }

  if (temaTardeNormalizado) {
    return temaTardeNormalizado
  }

  return temaLegadoNormalizado
}

export function resolverTemaDiaManha({
  temaDiaManha,
  temaDiaTarde,
  temaDia
} = {}) {
  const temaManhaNormalizado = normalizarTexto(temaDiaManha)

  if (temaManhaNormalizado) {
    return temaManhaNormalizado
  }

  const temaTardeNormalizado = normalizarTexto(temaDiaTarde)

  if (!temaTardeNormalizado) {
    return normalizarTexto(temaDia)
  }

  return ''
}

export function resolverTemaDiaTarde({
  temaDiaTarde
} = {}) {
  return normalizarTexto(temaDiaTarde)
}
