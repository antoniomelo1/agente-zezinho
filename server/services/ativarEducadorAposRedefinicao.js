import admin, { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'

export default async function ativarEducadorAposRedefinicao({ uid, email }) {
  if (!uid) {
    throw new Error('Uid obrigatorio para ativacao')
  }

  const userRef = adminDb.collection('usuarios').doc(uid)
  const userSnap = await userRef.get()

  if (!userSnap.exists) {
    throw new Error('Usuario sem cadastro institucional')
  }

  const userData = userSnap.data()

  if (userData.role !== ROLES.EDUCADOR) {
    throw new Error('Apenas educadores podem concluir primeiro acesso')
  }

  if (userData.email !== email) {
    throw new Error('Email autenticado divergente do cadastro institucional')
  }

  if (userData.ativo !== true) {
    throw new Error('Usuario inativo')
  }

  if (userData.status === 'ativo' && userData.primeiroAcessoPendente === false) {
    throw new Error('Primeiro acesso ja concluido')
  }

  if (userData.status !== 'pendente_ativacao') {
    throw new Error('Usuario nao esta pendente de ativacao')
  }

  await userRef.update({
    status: 'ativo',
    primeiroAcessoPendente: false,
    ativadoEm: admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  return {
    uid: userData.uid || uid,
    status: 'ativo',
    primeiroAcessoPendente: false
  }
}
