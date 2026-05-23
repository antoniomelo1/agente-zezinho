import admin, { adminDb } from '../firebaseAdmin.js'
import {
  ROLES,
  isRoleCoordenadorPedagogico,
  isRoleGestorPedagogico
} from '../constants/roles.js'

export class ExcluirRegistroDiarioError extends Error {
  constructor(publicMessage, statusCode = 400) {
    super(publicMessage)
    this.name = 'ExcluirRegistroDiarioError'
    this.publicMessage = publicMessage
    this.statusCode = statusCode
  }
}

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

  return valor.map(normalizarTexto).filter(Boolean)
}

function validarOperador(operador = {}) {
  if (!operador.uid || !operador.role) {
    throw new ExcluirRegistroDiarioError(
      'Usuário autenticado sem vínculo institucional válido.',
      403
    )
  }

  if (
    ![
      ROLES.COORDENADOR_PEDAGOGICO,
      ROLES.GESTOR_PEDAGOGICO
    ].includes(operador.role)
  ) {
    throw new ExcluirRegistroDiarioError('Acesso negado para este perfil.', 403)
  }
}

function validarEscopoCoordenador({ registro, operador }) {
  if (isRoleGestorPedagogico(operador.role)) {
    return
  }

  if (!isRoleCoordenadorPedagogico(operador.role)) {
    throw new ExcluirRegistroDiarioError('Acesso negado para este perfil.', 403)
  }

  const oficinaId = normalizarTexto(registro.oficinaId)
  const oficinasResponsaveis = normalizarListaTextos(operador.oficinasResponsaveis)

  if (!oficinasResponsaveis.includes(oficinaId)) {
    throw new ExcluirRegistroDiarioError(
      'Registro fora do escopo de responsabilidade do coordenador pedagógico.',
      403
    )
  }
}

export default async function excluirRegistroDiario({
  registroId,
  motivoExclusao,
  operador
}) {
  const registroIdNormalizado = normalizarTexto(registroId)
  const motivoNormalizado = normalizarTexto(motivoExclusao)

  if (!registroIdNormalizado) {
    throw new ExcluirRegistroDiarioError('Registro Diário obrigatório.')
  }

  if (!motivoNormalizado) {
    throw new ExcluirRegistroDiarioError('Motivo da exclusão é obrigatório.')
  }

  validarOperador(operador)

  const registroRef = adminDb
    .collection('registros_diarios')
    .doc(registroIdNormalizado)

  await adminDb.runTransaction(async (transaction) => {
    const registroSnap = await transaction.get(registroRef)

    if (!registroSnap.exists) {
      throw new ExcluirRegistroDiarioError('Registro Diário não encontrado.', 404)
    }

    const registro = registroSnap.data() || {}

    if (registro.excluido === true) {
      throw new ExcluirRegistroDiarioError(
        'Registro Diário já foi excluído logicamente.',
        409
      )
    }

    validarEscopoCoordenador({ registro, operador })

    transaction.update(registroRef, {
      excluido: true,
      excluidoEm: admin.firestore.FieldValue.serverTimestamp(),
      excluidoPor: operador.uid,
      nomeExcluidoPor: operador.nome || '',
      motivoExclusao: motivoNormalizado
    })
  })

  return {
    id: registroIdNormalizado,
    excluido: true
  }
}
