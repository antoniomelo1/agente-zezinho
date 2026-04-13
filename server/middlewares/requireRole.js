import { adminDb } from '../firebaseAdmin.js'

function possuiVinculoAtivo(userData = {}) {
  if (userData.ativo === false) {
    return false
  }

  if (userData.status && userData.status !== 'ativo') {
    return false
  }

  return true
}

export default function requireRole(rolesPermitidas = []) {
  return async function (req, res, next) {
    try {
      if (!req.auth?.uid) {
        return res.status(401).json({ erro: 'Usuario nao autenticado' })
      }

      const userRef = adminDb.collection('usuarios').doc(req.auth.uid)
      const userSnap = await userRef.get()

      if (!userSnap.exists) {
        return res.status(403).json({ erro: 'Usuario sem cadastro institucional' })
      }

      const userData = userSnap.data()

      if (!possuiVinculoAtivo(userData)) {
        return res.status(403).json({ erro: 'Usuario inativo' })
      }

      if (!rolesPermitidas.includes(userData.role)) {
        return res.status(403).json({ erro: 'Acesso negado para este perfil' })
      }

      req.currentUser = {
        uid: userData.uid || req.auth.uid,
        email: req.auth.email,
        nome: userData.nome || '',
        role: userData.role || '',
        status: userData.status || null,
        ativo: userData.ativo ?? userData.status === 'ativo',
        oficinaId: userData.oficinaId || null,
        oficinasResponsaveis: userData.oficinasResponsaveis || []
      }

      next()
    } catch (error) {
      console.error('Erro em requireRole:', error)
      return res.status(500).json({ erro: 'Erro ao validar permissoes' })
    }
  }
}
