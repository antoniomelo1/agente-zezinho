import { adminAuth } from '../firebaseAdmin.js'

export default async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não enviado ou inválido' })
    }

    const token = authHeader.split('Bearer ')[1]?.trim()

    if (!token) {
      return res.status(401).json({ erro: 'Token não enviado ou inválido' })
    }

    const decodedToken = await adminAuth.verifyIdToken(token)

    req.auth = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      claims: decodedToken
    }

    next()
  } catch (error) {
    console.error('Erro em requireAuth:', error.message)
    console.error('Código:', error.code)
    return res.status(401).json({ erro: 'Não autorizado' })
  }
}
