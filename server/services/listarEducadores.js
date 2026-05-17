import { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return String(valor).trim()
}

function normalizarListaTextos(valor) {
  if (!Array.isArray(valor)) {
    return []
  }

  return valor
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

function educadorEstaNoEscopo(educador, oficinasPermitidas) {
  if (oficinasPermitidas === null) {
    return true
  }

  return oficinasPermitidas.includes(normalizarTexto(educador.oficinaId))
}

function mapearEducador(doc) {
  const data = doc.data()

  return {
    uid: data.uid || doc.id,
    nome: data.nome || '',
    email: data.email || '',
    oficinaId: data.oficinaId || '',
    status: data.status || null,
    ativo: data.ativo === true,
    criadoEm: data.criadoEm || null,
    ativadoEm: data.ativadoEm || null
  }
}

export default async function listarEducadores({ operador } = {}) {
  const oficinasPermitidas = resolverOficinasPermitidas(operador)

  if (
    Array.isArray(oficinasPermitidas) &&
    oficinasPermitidas.length === 0
  ) {
    return []
  }

  const snapshot = await adminDb
    .collection('usuarios')
    .where('role', '==', ROLES.EDUCADOR)
    .get()

  return snapshot.docs
    .map(mapearEducador)
    .filter((educador) => educadorEstaNoEscopo(educador, oficinasPermitidas))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
