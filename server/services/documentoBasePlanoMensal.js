import admin, { adminDb } from '../firebaseAdmin.js'

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

function normalizarNumero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function normalizarRecursos(recursosPadrao) {
  if (Array.isArray(recursosPadrao)) {
    return recursosPadrao
      .map((item) => normalizarTexto(item))
      .filter(Boolean)
  }

  return normalizarTexto(recursosPadrao)
    .split(/\r?\n|,/)
    .map((item) => normalizarTexto(item))
    .filter(Boolean)
}

function validarSemestre(semestre) {
  return semestre === 1 || semestre === 2
}

function normalizarListaTexto(lista) {
  if (!Array.isArray(lista)) {
    return []
  }

  return lista
    .map((item) => normalizarTexto(item))
    .filter(Boolean)
}

function formatarSemestreLabel(semestre) {
  return semestre === 1 ? '1o semestre' : '2o semestre'
}

function normalizarTextoBuscaSemestre(texto) {
  return normalizarTexto(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function detectarSemestreNoTexto({ titulo, conteudo }) {
  const texto = normalizarTextoBuscaSemestre(`${titulo} ${conteudo}`)

  const indicaPrimeiroSemestre =
    /\b1\s*[oº°]\s*semestre\b/.test(texto) || /\bprimeiro\s+semestre\b/.test(texto)

  const indicaSegundoSemestre =
    /\b2\s*[oº°]\s*semestre\b/.test(texto) || /\bsegundo\s+semestre\b/.test(texto)

  if (indicaPrimeiroSemestre === indicaSegundoSemestre) {
    return null
  }

  return indicaPrimeiroSemestre ? 1 : 2
}

function validarCoerenciaSemestreDocumento({ titulo, conteudo, semestre }) {
  const semestreDetectado = detectarSemestreNoTexto({ titulo, conteudo })

  if (semestreDetectado && semestreDetectado !== semestre) {
    throw new Error(
      `O semestre informado não corresponde ao texto do documento base. O título ou conteúdo indica ${formatarSemestreLabel(semestreDetectado)}, mas o campo técnico está como ${formatarSemestreLabel(semestre)}.`
    )
  }
}

function montarAutor(user) {
  return {
    uid: user.uid || '',
    nome: user.nome || ''
  }
}

function validarUsuarioDocumentoBase(usuario = {}) {
  if (!usuario?.uid) {
    throw new Error('Usuário autenticado sem vínculo institucional válido')
  }

  if (usuario.role === 'educador' && !usuario.oficinaId) {
    throw new Error('Educador autenticado sem vínculo institucional válido')
  }

  return usuario
}

function obterEscopoOficinasCoordenador(usuario = {}) {
  const oficinasResponsaveis = normalizarListaTexto(usuario.oficinasResponsaveis)

  if (oficinasResponsaveis.length > 0) {
    return oficinasResponsaveis
  }

  const oficinaUnica = normalizarTexto(usuario.oficinaId)

  if (oficinaUnica) {
    return [oficinaUnica]
  }

  return []
}

function documentoEstaNoEscopo(usuario = {}, oficinaIdDocumento = '') {
  if (usuario.role === 'educador') {
    return normalizarTexto(usuario.oficinaId) === normalizarTexto(oficinaIdDocumento)
  }

  if (usuario.role === 'coordenador') {
    const escopo = obterEscopoOficinasCoordenador(usuario)

    if (escopo.length === 0) {
      return true
    }

    return escopo.includes(normalizarTexto(oficinaIdDocumento))
  }

  return false
}

function validarPermissaoEdicaoDocumentoBase(usuario = {}) {
  validarUsuarioDocumentoBase(usuario)

  if (usuario.role !== 'educador') {
    throw new Error(
      'A coordenação pode revisar e ativar versões, mas a elaboração e a edição do Documento Base do Plano Mensal permanecem com o educador.'
    )
  }

  return usuario
}

function validarPermissaoGovernancaDocumentoBase(usuario = {}) {
  validarUsuarioDocumentoBase(usuario)

  if (usuario.role !== 'coordenador') {
    throw new Error(
      'Somente a coordenação pode ativar ou desativar a versão do Documento Base do Plano Mensal.'
    )
  }

  return usuario
}

function normalizarDocumento(doc) {
  const data = doc.data()

  return {
    id: doc.id,
    oficinaId: data.oficinaId || '',
    ano: data.ano || null,
    semestre: data.semestre || null,
    tipo: data.tipo || '',
    titulo: data.titulo || '',
    versao: data.versao || null,
    ativo: data.ativo === true,
    conteudo: data.conteudo || '',
    eixoPedagogia: data.eixoPedagogia || '',
    recursosPadrao: Array.isArray(data.recursosPadrao) ? data.recursosPadrao : [],
    criadoPor: data.criadoPor || { uid: '', nome: '' },
    atualizadoPor: data.atualizadoPor || { uid: '', nome: '' },
    criadoEm: data.criadoEm?.toDate ? data.criadoEm.toDate().toISOString() : null,
    atualizadoEm: data.atualizadoEm?.toDate
      ? data.atualizadoEm.toDate().toISOString()
      : null
  }
}

function validarPayloadDocumento(payload = {}) {
  const ano = normalizarNumero(payload.ano)
  const semestre = normalizarNumero(payload.semestre)
  const versao = normalizarNumero(payload.versao)
  const titulo = normalizarTexto(payload.titulo)
  const conteudo = normalizarTexto(payload.conteudo)

  if (!ano || !validarSemestre(semestre) || !versao || !titulo || !conteudo) {
    throw new Error(
      'Ano, semestre, título, versão e conteúdo são obrigatórios para o documento base'
    )
  }

  validarCoerenciaSemestreDocumento({ titulo, conteudo, semestre })

  return {
    ano,
    semestre,
    versao,
    titulo,
    conteudo,
    eixoPedagogia: normalizarTexto(payload.eixoPedagogia),
    recursosPadrao: normalizarRecursos(payload.recursosPadrao)
  }
}

export async function listarDocumentosBasePlanoMensal({
  usuario,
  oficinaId,
  ano,
  semestre
}) {
  validarUsuarioDocumentoBase(usuario)

  let oficinaIdFiltro = normalizarTexto(oficinaId)

  if (usuario.role === 'educador') {
    oficinaIdFiltro = normalizarTexto(usuario.oficinaId)
  }

  if (usuario.role === 'coordenador' && oficinaIdFiltro) {
    const escopo = obterEscopoOficinasCoordenador(usuario)

    if (escopo.length > 0 && !escopo.includes(oficinaIdFiltro)) {
      throw new Error('Documento base fora do escopo institucional da coordenação')
    }
  }

  let query = adminDb
    .collection('documentos_base_plano_aulas')
    .where('tipo', '==', 'plano_aulas_base')

  if (oficinaIdFiltro) {
    query = query.where('oficinaId', '==', oficinaIdFiltro)
  }

  if (ano) {
    query = query.where('ano', '==', Number(ano))
  }

  if (semestre) {
    query = query.where('semestre', '==', Number(semestre))
  }

  const snapshot = await query.get()

  let documentos = snapshot.docs
    .map(normalizarDocumento)
  if (usuario.role === 'coordenador' && !oficinaIdFiltro) {
    const escopo = obterEscopoOficinasCoordenador(usuario)

    if (escopo.length > 0) {
      documentos = documentos.filter((documento) => escopo.includes(documento.oficinaId))
    }
  }

  documentos = documentos.sort((a, b) => {
    if (a.oficinaId !== b.oficinaId) {
      return a.oficinaId.localeCompare(b.oficinaId, 'pt-BR')
    }

    if (b.ano !== a.ano) {
      return b.ano - a.ano
    }

    if (b.semestre !== a.semestre) {
      return b.semestre - a.semestre
    }

    return b.versao - a.versao
  })

  return { documentos }
}

export async function salvarDocumentoBasePlanoMensal({
  payload,
  usuario
}) {
  const educador = validarPermissaoEdicaoDocumentoBase(usuario)

  const dadosValidados = validarPayloadDocumento(payload)
  const id = normalizarTexto(payload.id)
  const autor = montarAutor(educador)

  if (id) {
    const docRef = adminDb.collection('documentos_base_plano_aulas').doc(id)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      throw new Error('Documento base não encontrado para edição')
    }

    const documentoAtual = docSnap.data()

    if ((documentoAtual.oficinaId || '') !== educador.oficinaId) {
      throw new Error('Documento base fora da oficina do educador autenticado')
    }

    await docRef.set(
      {
        ...documentoAtual,
        oficinaId: educador.oficinaId,
        ano: dadosValidados.ano,
        semestre: dadosValidados.semestre,
        tipo: 'plano_aulas_base',
        titulo: dadosValidados.titulo,
        versao: dadosValidados.versao,
        conteudo: dadosValidados.conteudo,
        eixoPedagogia: dadosValidados.eixoPedagogia,
        recursosPadrao: dadosValidados.recursosPadrao,
        atualizadoPor: autor,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    )

    const atualizado = await docRef.get()

    return normalizarDocumento(atualizado)
  }

  const docRef = adminDb.collection('documentos_base_plano_aulas').doc()

  await docRef.set({
    oficinaId: educador.oficinaId,
    ano: dadosValidados.ano,
    semestre: dadosValidados.semestre,
    tipo: 'plano_aulas_base',
    titulo: dadosValidados.titulo,
    versao: dadosValidados.versao,
    ativo: false,
    conteudo: dadosValidados.conteudo,
    eixoPedagogia: dadosValidados.eixoPedagogia,
    recursosPadrao: dadosValidados.recursosPadrao,
    criadoPor: autor,
    atualizadoPor: autor,
    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  const criado = await docRef.get()

  return normalizarDocumento(criado)
}

export async function ativarDocumentoBasePlanoMensal({
  documentoId,
  usuario
}) {
  const coordenador = validarPermissaoGovernancaDocumentoBase(usuario)

  const id = normalizarTexto(documentoId)

  if (!id) {
    throw new Error('Documento base obrigatório para ativação')
  }

  const docRef = adminDb.collection('documentos_base_plano_aulas').doc(id)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw new Error('Documento base não encontrado para ativação')
  }

  const documento = docSnap.data()

  if (!documentoEstaNoEscopo(coordenador, documento.oficinaId || '')) {
    throw new Error('Documento base fora do escopo institucional da coordenação')
  }

  validarCoerenciaSemestreDocumento({
    titulo: documento.titulo,
    conteudo: documento.conteudo,
    semestre: documento.semestre
  })

  const snapshotRelacionados = await adminDb
    .collection('documentos_base_plano_aulas')
    .where('oficinaId', '==', documento.oficinaId)
    .where('ano', '==', documento.ano)
    .where('semestre', '==', documento.semestre)
    .where('tipo', '==', 'plano_aulas_base')
    .get()

  const batch = adminDb.batch()
  const autor = montarAutor(coordenador)

  snapshotRelacionados.docs.forEach((item) => {
    batch.update(item.ref, {
      ativo: item.id === id,
      atualizadoPor: autor,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    })
  })

  await batch.commit()

  const atualizado = await docRef.get()

  return normalizarDocumento(atualizado)
}

export async function desativarDocumentoBasePlanoMensal({
  documentoId,
  usuario
}) {
  const coordenador = validarPermissaoGovernancaDocumentoBase(usuario)
  const id = normalizarTexto(documentoId)

  if (!id) {
    throw new Error('Documento base obrigatório para desativação')
  }

  const docRef = adminDb.collection('documentos_base_plano_aulas').doc(id)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw new Error('Documento base não encontrado para desativação')
  }

  const documento = docSnap.data()

  if (!documentoEstaNoEscopo(coordenador, documento.oficinaId || '')) {
    throw new Error('Documento base fora do escopo institucional da coordenação')
  }

  await docRef.update({
    ativo: false,
    atualizadoPor: montarAutor(coordenador),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  const atualizado = await docRef.get()

  return normalizarDocumento(atualizado)
}
