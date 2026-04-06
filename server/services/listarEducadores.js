import { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'

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

export default async function listarEducadores() {
  const snapshot = await adminDb
    .collection('usuarios')
    .where('role', '==', ROLES.EDUCADOR)
    .get()

  return snapshot.docs
    .map(mapearEducador)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
