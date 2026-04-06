import admin, { adminDb } from '../firebaseAdmin.js'

const TIPOS_AULA_PADRAO = new Set([
  'aula regular',
  'aulão',
  'projeto',
  'hackathon'
])

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

function normalizarArray(valor) {
  return Array.isArray(valor) ? valor : []
}

function normalizarTipoAula(valor) {
  const tipoNormalizado = normalizarTexto(valor).toLowerCase()

  if (!tipoNormalizado) {
    return 'aula regular'
  }

  return TIPOS_AULA_PADRAO.has(tipoNormalizado)
    ? tipoNormalizado
    : tipoNormalizado
}

function validarPayload(payload = {}) {
  if (!payload.data) {
    throw new Error('Data obrigatoria')
  }

  if (!normalizarTexto(payload.modulo) || !normalizarTexto(payload.temaDia)) {
    throw new Error('Modulo e tema do dia sao obrigatorios')
  }

  if (
    !normalizarTexto(payload.resumoManha) &&
    !normalizarTexto(payload.resumoTarde)
  ) {
    throw new Error('Ao menos um resumo deve ser informado')
  }
}

function converterData(data) {
  const dataConvertida = new Date(`${data}T00:00:00`)

  if (Number.isNaN(dataConvertida.getTime())) {
    throw new Error('Data invalida')
  }

  return dataConvertida
}

function normalizarTotalPresentes(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null
  }

  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : null
}

function normalizarTotalPresentesLegado({
  totalPresentes,
  totalPresentesManha,
  totalPresentesTarde
}) {
  const totalLegado = normalizarTotalPresentes(totalPresentes)

  if (totalLegado !== null) {
    return totalLegado
  }

  if (totalPresentesManha !== null && totalPresentesTarde === null) {
    return totalPresentesManha
  }

  if (totalPresentesTarde !== null && totalPresentesManha === null) {
    return totalPresentesTarde
  }

  return null
}

export default async function salvarRegistroDiario({
  payload,
  educador
}) {
  validarPayload(payload)

  const dataConvertida = converterData(payload.data)
  const resumoManha = normalizarTexto(payload.resumoManha)
  const resumoTarde = normalizarTexto(payload.resumoTarde)
  const observacoes = normalizarTexto(payload.observacoes)
  const totalPresentesManha = normalizarTotalPresentes(payload.totalPresentesManha)
  const totalPresentesTarde = normalizarTotalPresentes(payload.totalPresentesTarde)

  const registroNormalizado = {
    data: admin.firestore.Timestamp.fromDate(dataConvertida),
    ano: dataConvertida.getFullYear(),
    mes: dataConvertida.getMonth() + 1,
    uidEducador: educador.uid,
    nomeEducador: educador.nome || null,
    oficinaId: educador.oficinaId || null,
    modulo: normalizarTexto(payload.modulo),
    tipoAula: normalizarTipoAula(payload.tipoAula),
    temaDia: normalizarTexto(payload.temaDia),
    temaAnterior: normalizarTexto(payload.temaAnterior),
    resumoManha,
    resumoTarde,
    softOriente: normalizarTexto(payload.softOriente),
    softCoracao: normalizarTexto(payload.softCoracao),
    projetoFinal: normalizarTexto(payload.projetoFinal),
    projetoHackathon: normalizarTexto(payload.projetoHackathon),
    observacoes,
    fotos: normalizarArray(payload.fotos),
    totalPresentesManha,
    totalPresentesTarde,
    totalPresentes: normalizarTotalPresentesLegado({
      totalPresentes: payload.totalPresentes,
      totalPresentesManha,
      totalPresentesTarde
    }),
    temResumoManha: Boolean(resumoManha),
    temResumoTarde: Boolean(resumoTarde),
    temObservacoes: Boolean(observacoes),
    dentroPlanejado: null,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    excluido: false,
    excluidoPor: null,
    motivoExclusao: '',
    excluidoEm: null
  }

  const docRef = await adminDb.collection('registros_diarios').add(registroNormalizado)

  return {
    id: docRef.id
  }
}
