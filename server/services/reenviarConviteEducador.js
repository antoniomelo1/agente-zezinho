import admin, { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'
import gerarLinkPrimeiroAcesso from './gerarLinkPrimeiroAcesso.js'

export default async function reenviarConviteEducador({ uid }) {
  if (!uid) {
    throw new Error('Uid obrigatório para reenvio')
  }

  const userRef = adminDb.collection('usuarios').doc(uid)
  const userSnap = await userRef.get()

  if (!userSnap.exists) {
    throw new Error('Educador não encontrado')
  }

  const userData = userSnap.data()

  if (userData.role !== ROLES.EDUCADOR) {
    throw new Error('Usuário informado não é educador')
  }

  if (userData.ativo === false) {
    throw new Error('Educador inativo')
  }

  if (userData.status !== 'pendente_ativacao') {
    throw new Error('Reenvio disponível apenas para educador pendente de ativação')
  }

  const { linkPrimeiroAcesso } = await gerarLinkPrimeiroAcesso(userData.email)

  await userRef.update({
    conviteEnviadoEm: admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  return {
    usuario: {
      uid: userData.uid || uid,
      nome: userData.nome,
      email: userData.email,
      status: userData.status,
      primeiroAcessoPendente: userData.primeiroAcessoPendente !== false
    },
    linkPrimeiroAcesso
  }
}
