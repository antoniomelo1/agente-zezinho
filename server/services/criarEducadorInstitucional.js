import crypto from 'node:crypto'

import admin, { adminAuth, adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'
import gerarLinkPrimeiroAcesso from './gerarLinkPrimeiroAcesso.js'

function gerarSenhaInterna() {
  return crypto.randomBytes(24).toString('base64url')
}

function validarDadosEntrada({ nome, email, oficinaId }) {
  if (!nome || !email || !oficinaId) {
    throw new Error('Nome, email e oficinaId sao obrigatorios')
  }
}

export default async function criarEducadorInstitucional({
  nome,
  email,
  oficinaId,
  criadoPorUid
}) {
  validarDadosEntrada({ nome, email, oficinaId })

  const nomeLimpo = String(nome).trim()
  const emailLimpo = String(email).trim().toLowerCase()
  const oficinaIdLimpo = String(oficinaId).trim()

  let userRecord = null

  try {
    userRecord = await adminAuth.createUser({
      displayName: nomeLimpo,
      email: emailLimpo,
      password: gerarSenhaInterna(),
      disabled: false
    })

    const { linkPrimeiroAcesso } = await gerarLinkPrimeiroAcesso(emailLimpo)

    await adminDb.collection('usuarios').doc(userRecord.uid).set({
      uid: userRecord.uid,
      nome: nomeLimpo,
      email: emailLimpo,
      role: ROLES.EDUCADOR,
      ativo: true,
      status: 'pendente_ativacao',
      oficinaId: oficinaIdLimpo,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      criadoPorUid,
      primeiroAcessoPendente: true,
      conviteEnviadoEm: admin.firestore.FieldValue.serverTimestamp(),
      ativadoEm: null
    })

    return {
      usuario: {
        uid: userRecord.uid,
        nome: nomeLimpo,
        email: emailLimpo,
        role: ROLES.EDUCADOR,
        ativo: true,
        status: 'pendente_ativacao',
        oficinaId: oficinaIdLimpo,
        criadoPorUid,
        primeiroAcessoPendente: true,
        ativadoEm: null
      },
      linkPrimeiroAcesso
    }
  } catch (error) {
    if (userRecord?.uid) {
      try {
        await adminAuth.deleteUser(userRecord.uid)
      } catch (rollbackError) {
        console.error(
          'Falha ao reverter usuario no Auth apos erro na criacao institucional:',
          rollbackError
        )
      }
    }

    throw error
  }
}
