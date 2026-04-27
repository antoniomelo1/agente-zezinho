import crypto from 'node:crypto'

import admin, { adminAuth, adminDb } from '../firebaseAdmin.js'
import { ROLES, isRoleGestorPedagogico } from '../constants/roles.js'
import gerarLinkPrimeiroAcesso from './gerarLinkPrimeiroAcesso.js'

export class GestaoUsuariosError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'GestaoUsuariosError'
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

function validarNomeEmail({ nome, email }) {
  if (!normalizarTexto(nome) || !normalizarEmail(email)) {
    throw new GestaoUsuariosError('Nome e e-mail institucional são obrigatórios.')
  }
}

function validarGestorPedagogico(usuario = {}) {
  if (!isRoleGestorPedagogico(usuario.role)) {
    throw new GestaoUsuariosError('Acesso restrito à gestão pedagógica.', 403)
  }
}

function montarOperador(usuario = {}) {
  return {
    uid: usuario.uid || '',
    nome: usuario.nome || ''
  }
}

function normalizarDataFirestore(valor) {
  if (valor?.toDate) {
    return valor.toDate().toISOString()
  }

  return valor || null
}

function mapearUsuario(doc, authUser = null) {
  const data = doc.data()

  return {
    uid: data.uid || doc.id,
    nome: data.nome || '',
    email: data.email || authUser?.email || '',
    role: data.role || '',
    ativo: data.ativo === true,
    status: data.status || null,
    oficinaId: data.oficinaId || '',
    oficinasResponsaveis: Array.isArray(data.oficinasResponsaveis)
      ? data.oficinasResponsaveis
      : [],
    primeiroAcessoPendente: data.primeiroAcessoPendente === true,
    authDisabled: authUser?.disabled === true,
    criadoEm: normalizarDataFirestore(data.criadoEm),
    atualizadoEm: normalizarDataFirestore(data.atualizadoEm),
    ativadoEm: normalizarDataFirestore(data.ativadoEm),
    desabilitadoEm: normalizarDataFirestore(data.desabilitadoEm),
    habilitadoEm: normalizarDataFirestore(data.habilitadoEm)
  }
}

function mapearOficina(doc) {
  const data = doc.data()

  return {
    id: doc.id,
    nome: data.nome || data.nomeOficina || data.titulo || data.label || doc.id,
    ativa: data.ativa !== false
  }
}

async function buscarAuthUser(uid) {
  try {
    return await adminAuth.getUser(uid)
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return null
    }

    throw error
  }
}

async function validarOficinaExistente(oficinaId) {
  const oficinaSnap = await adminDb.collection('oficinas').doc(oficinaId).get()

  if (!oficinaSnap.exists) {
    throw new GestaoUsuariosError('Oficina institucional não encontrada.', 400)
  }
}

async function criarUsuarioInstitucional({
  nome,
  email,
  role,
  oficinaId,
  criadoPorUid
}) {
  validarNomeEmail({ nome, email })

  if (![ROLES.EDUCADOR, ROLES.COORDENADOR_PEDAGOGICO].includes(role)) {
    throw new GestaoUsuariosError('Perfil institucional inválido.')
  }

  const nomeLimpo = normalizarTexto(nome)
  const emailLimpo = normalizarEmail(email)
  const oficinaIdLimpo = normalizarTexto(oficinaId)

  if ([ROLES.EDUCADOR, ROLES.COORDENADOR_PEDAGOGICO].includes(role) && !oficinaIdLimpo) {
    throw new GestaoUsuariosError('A oficina é obrigatória para este perfil institucional.')
  }

  await validarOficinaExistente(oficinaIdLimpo)

  let userRecord = null

  try {
    userRecord = await adminAuth.createUser({
      displayName: nomeLimpo,
      email: emailLimpo,
      password: gerarSenhaInterna(),
      disabled: false
    })

    const { linkPrimeiroAcesso } = await gerarLinkPrimeiroAcesso(emailLimpo)

    const dadosUsuario = {
      uid: userRecord.uid,
      nome: nomeLimpo,
      email: emailLimpo,
      role,
      ativo: true,
      status: 'pendente_ativacao',
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      criadoPorUid,
      primeiroAcessoPendente: true,
      conviteEnviadoEm: admin.firestore.FieldValue.serverTimestamp(),
      ativadoEm: null,
      desabilitadoEm: null,
      desabilitadoPor: null,
      motivoDesabilitacao: null,
      habilitadoEm: null,
      habilitadoPor: null
    }

    if (role === ROLES.EDUCADOR) {
      dadosUsuario.oficinaId = oficinaIdLimpo
    }

    if (role === ROLES.COORDENADOR_PEDAGOGICO) {
      dadosUsuario.oficinasResponsaveis = [oficinaIdLimpo]
    }

    await adminDb.collection('usuarios').doc(userRecord.uid).set(dadosUsuario)

    return {
      usuario: {
        uid: userRecord.uid,
        nome: nomeLimpo,
        email: emailLimpo,
        role,
        ativo: true,
        status: 'pendente_ativacao',
        oficinaId: role === ROLES.EDUCADOR ? oficinaIdLimpo : '',
        oficinasResponsaveis: role === ROLES.COORDENADOR_PEDAGOGICO ? [oficinaIdLimpo] : undefined,
        primeiroAcessoPendente: true
      },
      linkPrimeiroAcesso
    }
  } catch (error) {
    if (userRecord?.uid) {
      try {
        await adminAuth.deleteUser(userRecord.uid)
      } catch (rollbackError) {
        console.error('Falha ao reverter criação de usuário institucional:', rollbackError)
      }
    }

    if (error.code === 'auth/email-already-exists') {
      throw new GestaoUsuariosError('E-mail institucional já cadastrado.', 409)
    }

    throw error
  }
}

export async function listarUsuariosInstitucionais({ operador }) {
  validarGestorPedagogico(operador)

  const snapshot = await adminDb.collection('usuarios').get()
  const usuarios = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const authUser = await buscarAuthUser(doc.id)
      return mapearUsuario(doc, authUser)
    })
  )

  return usuarios.sort((a, b) => {
    if (a.role !== b.role) {
      return a.role.localeCompare(b.role, 'pt-BR')
    }

    return a.nome.localeCompare(b.nome, 'pt-BR')
  })
}

export async function listarOficinasInstitucionais({ operador }) {
  validarGestorPedagogico(operador)

  const snapshot = await adminDb.collection('oficinas').get()
  const oficinas = snapshot.docs
    .map(mapearOficina)
    .filter((oficina) => oficina.ativa)

  return oficinas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function criarEducadorPorMaster({
  payload,
  operador
}) {
  validarGestorPedagogico(operador)

  return criarUsuarioInstitucional({
    nome: payload?.nome,
    email: payload?.email,
    oficinaId: payload?.oficinaId,
    role: ROLES.EDUCADOR,
    criadoPorUid: operador.uid
  })
}

export async function criarCoordenadorPorMaster({
  payload,
  operador
}) {
  validarGestorPedagogico(operador)

  return criarUsuarioInstitucional({
    nome: payload?.nome,
    email: payload?.email,
    oficinaId: payload?.oficinaId,
    role: ROLES.COORDENADOR_PEDAGOGICO,
    criadoPorUid: operador.uid
  })
}

async function buscarUsuarioInstitucional(uid) {
  const uidLimpo = normalizarTexto(uid)

  if (!uidLimpo) {
    throw new GestaoUsuariosError('Usuário institucional não informado.')
  }

  const userRef = adminDb.collection('usuarios').doc(uidLimpo)
  const userSnap = await userRef.get()

  if (!userSnap.exists) {
    throw new GestaoUsuariosError('Usuário institucional não encontrado.', 404)
  }

  return {
    uid: uidLimpo,
    ref: userRef,
    data: userSnap.data()
  }
}

export async function desabilitarUsuarioInstitucional({
  uid,
  motivo,
  operador
}) {
  validarGestorPedagogico(operador)

  const usuario = await buscarUsuarioInstitucional(uid)

  if (usuario.uid === operador.uid) {
    throw new GestaoUsuariosError('A gestão pedagógica não pode desabilitar a própria conta.', 403)
  }

  if (isRoleGestorPedagogico(usuario.data.role)) {
    throw new GestaoUsuariosError(
      'A desabilitação de gestão pedagógica exige governança específica.',
      403
    )
  }

  await adminAuth.updateUser(usuario.uid, { disabled: true })

  await usuario.ref.update({
    ativo: false,
    statusAnteriorDesabilitacao: usuario.data.status || null,
    status: 'inativo',
    desabilitadoEm: admin.firestore.FieldValue.serverTimestamp(),
    desabilitadoPor: montarOperador(operador),
    motivoDesabilitacao: normalizarTexto(motivo) || null,
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  const atualizado = await usuario.ref.get()
  const authUser = await buscarAuthUser(usuario.uid)

  return mapearUsuario(atualizado, authUser)
}

export async function habilitarUsuarioInstitucional({
  uid,
  operador
}) {
  validarGestorPedagogico(operador)

  const usuario = await buscarUsuarioInstitucional(uid)

  if (isRoleGestorPedagogico(usuario.data.role)) {
    throw new GestaoUsuariosError(
      'A habilitação de gestão pedagógica exige governança específica.',
      403
    )
  }

  const statusAnterior = usuario.data.statusAnteriorDesabilitacao
  const statusRestaurado = statusAnterior === 'pendente_ativacao'
    ? 'pendente_ativacao'
    : 'ativo'

  await adminAuth.updateUser(usuario.uid, { disabled: false })

  await usuario.ref.update({
    ativo: true,
    status: statusRestaurado,
    statusAnteriorDesabilitacao: null,
    habilitadoEm: admin.firestore.FieldValue.serverTimestamp(),
    habilitadoPor: montarOperador(operador),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  const atualizado = await usuario.ref.get()
  const authUser = await buscarAuthUser(usuario.uid)

  return mapearUsuario(atualizado, authUser)
}
