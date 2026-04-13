import { adminDb } from '../firebaseAdmin.js'

import normalizarRegistroDiario from './helpers/normalizarRegistroDiario.js'

export async function buscarRegistrosDiariosPorPeriodo({
  timestampInicio,
  timestampFim
}) {
  const snapshot = await adminDb
    .collection('registros_diarios')
    .where('data', '>=', timestampInicio)
    .where('data', '<=', timestampFim)
    .where('excluido', '==', false)
    .orderBy('data')
    .get()

  if (snapshot.empty) {
    throw new Error('Nenhum registro diário encontrado para o período')
  }

  const registros = snapshot.docs.map(normalizarRegistroDiario)

  registros.sort((a, b) => new Date(a.dataISO) - new Date(b.dataISO))

  return registros
}

export async function buscarTextoBaseDefesaProjetoPorAno({ ano }) {
  const planoSnap = await adminDb
    .collection('plano_anual')
    .doc(String(ano))
    .get()

  if (!planoSnap.exists) {
    throw new Error('Plano anual não encontrado')
  }

  return planoSnap.data().defesaProjetoAplicado || ''
}
