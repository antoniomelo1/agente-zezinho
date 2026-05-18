import crypto from 'node:crypto'

import admin, { adminAuth, adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'
import gerarLinkPrimeiroAcesso from './gerarLinkPrimeiroAcesso.js'

export class CriarEducadorInstitucionalError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'CriarEducadorInstitucionalError'
    this.statusCode = statusCode
    this.publicMessage = message
  }
}

function gerarSenhaInterna() {
  return crypto.randomBytes(24).toString('base64url')
}

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return String(valor).trim()
}

function normalizarEmail(email) {
  return normalizarTexto(email).toLowerCase()
}

function normalizarListaTextos(valor) {
  if (!Array.isArray(valor)) {
    return []
  }

  return valor
    .map(normalizarTexto)
    .filter(Boolean)
}

function validarDadosEntrada({ nome, email }) {
  if (!normalizarTexto(nome) || !normalizarEmail(email)) {
    throw new CriarEducadorInstitucionalError('Nome e e-mail sao obrigatorios.')
  }
}

async function validarOficinaExistente(oficinaId) {
  const oficinaIdLimpo = normalizarTexto(oficinaId)

  if (!oficinaIdLimpo) {
    throw new CriarEducadorInstitucionalError('Oficina e obrigatoria.')
  }

  const oficinaSnap = await adminDb
    .collection('oficinas')
    .where('oficinaId', '==', oficinaIdLimpo)
    .limit(1)
    .get()

  if (oficinaSnap.empty) {
    throw new CriarEducadorInstitucionalError('Oficina institucional nao encontrada.')
  }
}

function resolverOficinaParaCoordenador({ oficinaId, operador }) {
  const oficinasResponsaveis = normalizarListaTextos(operador?.oficinasResponsaveis)
  const oficinaIdLimpo = normalizarTexto(oficinaId)

  if (oficinasResponsaveis.length === 0) {
    throw new CriarEducadorInstitucionalError(
      'Coordenador sem oficinas responsaveis nao pode criar educadores.',
      403
    )
  }

  if (oficinasResponsaveis.length === 1) {
    const oficinaUnica = oficinasResponsaveis[0]

    if (oficinaIdLimpo && oficinaIdLimpo !== oficinaUnica) {
      throw new CriarEducadorInstitucionalError(
        'Oficina fora do escopo institucional do coordenador.',
        403
      )
    }

    return oficinaUnica
  }

  if (!oficinaIdLimpo) {
    throw new CriarEducadorInstitucionalError(
      'Oficina e obrigatoria para coordenador com multiplas oficinas.'
    )
  }

  if (!oficinasResponsaveis.includes(oficinaIdLimpo)) {
    throw new CriarEducadorInstitucionalError(
      'Oficina fora do escopo institucional do coordenador.',
      403
    )
  }

  return oficinaIdLimpo
}

async function resolverOficinaEfetiva({ oficinaId, operador }) {
  if (operador?.role === ROLES.GESTOR_PEDAGOGICO) {
    const oficinaIdLimpo = normalizarTexto(oficinaId)
    await validarOficinaExistente(oficinaIdLimpo)
    return oficinaIdLimpo
  }

  if (operador?.role === ROLES.COORDENADOR_PEDAGOGICO) {
    const oficinaIdEfetiva = resolverOficinaParaCoordenador({ oficinaId, operador })
    await validarOficinaExistente(oficinaIdEfetiva)
    return oficinaIdEfetiva
  }

  throw new CriarEducadorInstitucionalError(
    'Acesso restrito a coordenacao pedagogica.',
    403
  )
}

export default async function criarEducadorInstitucional({
  nome,
  email,
  oficinaId,
  criadoPorUid,
  operador
}) {
  validarDadosEntrada({ nome, email })

  const nomeLimpo = normalizarTexto(nome)
  const emailLimpo = normalizarEmail(email)
  const oficinaIdEfetiva = await resolverOficinaEfetiva({ oficinaId, operador })

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
      oficinaId: oficinaIdEfetiva,
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
        oficinaId: oficinaIdEfetiva,
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
