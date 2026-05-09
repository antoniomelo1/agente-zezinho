import admin, { adminDb } from '../firebaseAdmin.js'
import { resolverTemaDiaDerivado } from './helpers/resolverTemaDoRegistro.js'

function dataSelecionadaEhValida(dataSelecionada) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataSelecionada || ''))) {
    return false
  }

  const data = new Date(`${dataSelecionada}T00:00:00`)

  return !Number.isNaN(data.getTime())
}

export default async function buscarTemaAnteriorSugerido({
  uid,
  dataSelecionada
}) {
  if (!uid) {
    throw new Error('Usuario autenticado obrigatorio')
  }

  if (!dataSelecionadaEhValida(dataSelecionada)) {
    throw new Error('Data selecionada invalida')
  }

  const usuarioSnap = await adminDb.collection('usuarios').doc(uid).get()

  if (!usuarioSnap.exists) {
    throw new Error('Usuario sem cadastro institucional')
  }

  const usuario = usuarioSnap.data()
  const oficinaId = usuario.oficinaId || ''

  if (!oficinaId) {
    return { temaAnteriorSugerido: '' }
  }

  const dataLimite = new Date(`${dataSelecionada}T00:00:00`)
  const timestampLimite = admin.firestore.Timestamp.fromDate(dataLimite)

  const snapshot = await adminDb
    .collection('registros_diarios')
    .where('oficinaId', '==', oficinaId)
    .where('excluido', '==', false)
    .where('data', '<', timestampLimite)
    .orderBy('data', 'desc')
    .limit(10)
    .get()

  const registroComTema = snapshot.docs.find((doc) =>
    Boolean(resolverTemaDiaDerivado(doc.data()))
  )

  if (!registroComTema) {
    return { temaAnteriorSugerido: '' }
  }

  return {
    temaAnteriorSugerido: resolverTemaDiaDerivado(registroComTema.data())
  }
}
