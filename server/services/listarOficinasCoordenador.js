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

function mapearOficina(doc) {
  const data = doc.data()
  const oficinaId = normalizarTexto(data.oficinaId) || doc.id

  return {
    id: oficinaId,
    nome: data.nome || data.nomeOficina || data.titulo || data.label || oficinaId,
    ativa: data.ativa !== false
  }
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

function oficinaEstaPermitida(oficina, oficinasPermitidas) {
  if (oficinasPermitidas === null) {
    return true
  }

  return oficinasPermitidas.includes(normalizarTexto(oficina.id))
}

export default async function listarOficinasCoordenador({ operador } = {}) {
  const oficinasPermitidas = resolverOficinasPermitidas(operador)

  if (Array.isArray(oficinasPermitidas) && oficinasPermitidas.length === 0) {
    return []
  }

  const snapshot = await adminDb.collection('oficinas').get()

  return snapshot.docs
    .map(mapearOficina)
    .filter((oficina) => oficina.ativa)
    .filter((oficina) => oficinaEstaPermitida(oficina, oficinasPermitidas))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
