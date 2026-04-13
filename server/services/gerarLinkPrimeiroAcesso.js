import { adminAuth } from '../firebaseAdmin.js'

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(
  /\/$/,
  ''
)

function montarLinkPrimeiroAcesso(linkNativo) {
  const urlNativa = new URL(linkNativo)
  const oobCode = urlNativa.searchParams.get('oobCode')

  if (!oobCode) {
    throw new Error('Link nativo de redefinicao invalido')
  }

  const urlAplicacao = new URL(`${FRONTEND_URL}/primeiro-acesso`)

  for (const [chave, valor] of urlNativa.searchParams.entries()) {
    urlAplicacao.searchParams.append(chave, valor)
  }

  if (!urlAplicacao.searchParams.get('mode')) {
    urlAplicacao.searchParams.set('mode', 'resetPassword')
  }

  return urlAplicacao.toString()
}

export default async function gerarLinkPrimeiroAcesso(email) {
  const linkNativo = await adminAuth.generatePasswordResetLink(email)
  const linkPrimeiroAcesso = montarLinkPrimeiroAcesso(linkNativo)

  return {
    linkNativo,
    linkPrimeiroAcesso
  }
}
