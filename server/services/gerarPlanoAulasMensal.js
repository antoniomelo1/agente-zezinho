import admin, { adminDb } from '../firebaseAdmin.js'
import fetch from 'node-fetch'

import gerarCalendarioPlanoAulasMensal from './helpers/gerarCalendarioPlanoAulasMensal.js'

function normalizarTexto(valor) {
  if (typeof valor !== 'string') {
    return ''
  }

  return valor.trim()
}

function corrigirOrtografiaInstitucional(texto) {
  if (typeof texto !== 'string') {
    return ''
  }

  const substituicoes = [
    [/\bProgramacao\b/g, 'Programação'],
    [/\bprogramacao\b/g, 'programação'],
    [/\bModulo\b/g, 'Módulo'],
    [/\bmodulo\b/g, 'módulo'],
    [/\bConsolidacao\b/g, 'Consolidação'],
    [/\bconsolidacao\b/g, 'consolidação'],
    [/\bParticipacao\b/g, 'Participação'],
    [/\bparticipacao\b/g, 'participação'],
    [/\bOrganizacao\b/g, 'Organização'],
    [/\borganizacao\b/g, 'organização'],
    [/\bEstilizacoes\b/g, 'Estilizações'],
    [/\bestilizacoes\b/g, 'estilizações'],
    [/\bApropriacao\b/g, 'Apropriação'],
    [/\bapropriacao\b/g, 'apropriação'],
    [/\bPedagogico\b/g, 'Pedagógico'],
    [/\bpedagogico\b/g, 'pedagógico'],
    [/\bLogico\b/g, 'Lógico'],
    [/\blogico\b/g, 'lógico'],
    [/\bTecnico\b/g, 'Técnico'],
    [/\btecnico\b/g, 'técnico'],
    [/\bSistematizacao\b/g, 'Sistematização'],
    [/\bsistematizacao\b/g, 'sistematização'],
    [/\bApresentacao\b/g, 'Apresentação'],
    [/\bapresentacao\b/g, 'apresentação'],
    [/\bConteudo\b/g, 'Conteúdo'],
    [/\bconteudo\b/g, 'conteúdo'],
    [/\bVivencias\b/g, 'Vivências'],
    [/\bvivencias\b/g, 'vivências'],
    [/\bFormativo\b/g, 'Formativo'],
    [/\bformativo\b/g, 'formativo'],
    [/\bOrientado\b/g, 'Orientado'],
    [/\borientado\b/g, 'orientado'],
    [/\bTerca-feira\b/g, 'Terça-feira'],
    [/\bQuarta-feira\b/g, 'Quarta-feira'],
    [/\bQuinta-feira\b/g, 'Quinta-feira'],
    [/\bRaciocinio\b/g, 'Raciocínio'],
    [/\braciocinio\b/g, 'raciocínio']
  ]

  return substituicoes.reduce(
    (textoAtual, [padrao, substituicao]) => textoAtual.replace(padrao, substituicao),
    normalizarTexto(texto)
  )
}

function formatarDataInstitucional(dataISO) {
  const [ano, mes, dia] = String(dataISO).split('-')

  if (!ano || !mes || !dia) {
    return String(dataISO)
  }

  return `${dia}/${mes}/${ano}`
}

function normalizarLista(valor) {
  if (!Array.isArray(valor)) {
    return []
  }

  return valor
    .map((item) => normalizarTexto(item))
    .filter(Boolean)
}

function obterMesAnterior({ ano, mes }) {
  if (mes === 1) {
    return { ano: ano - 1, mes: 12 }
  }

  return { ano, mes: mes - 1 }
}

function obterSemestrePorMes(mes) {
  return mes <= 6 ? 1 : 2
}

function formatarSemestreLabel(semestre) {
  return semestre === 1 ? '1o semestre' : '2o semestre'
}

function nomeOficina(oficinaId) {
  if (oficinaId === 'programacao') {
    return 'Oficina de Programação'
  }

  return corrigirOrtografiaInstitucional(normalizarTexto(oficinaId)) || 'Oficina institucional'
}

function extrairListaTexto(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarTexto(item)).filter(Boolean)
  }

  const texto = normalizarTexto(valor)

  if (!texto) {
    return []
  }

  return texto
    .split(/\r?\n|,/)
    .map((item) => normalizarTexto(item))
    .filter(Boolean)
}

function montarProjetoMes(modulosPrevistos, referenciaMesAnterior) {
  if (modulosPrevistos.length > 0) {
    return corrigirOrtografiaInstitucional(
      `Continuidade formativa do módulo ${modulosPrevistos[0]}`
    )
  }

  const projetoAnterior = normalizarTexto(referenciaMesAnterior?.cabecalho?.projetoMes)

  if (projetoAnterior) {
    return corrigirOrtografiaInstitucional(projetoAnterior)
  }

  return 'Continuidade do percurso formativo em programação'
}

function montarObjetivosEspecificos({ modulo, diaSemanaLabel, indiceDiaGlobal }) {
  const moduloCorrigido = corrigirOrtografiaInstitucional(modulo)
  const diaCorrigido = corrigirOrtografiaInstitucional(diaSemanaLabel.toLowerCase())
  const blocosObjetivos = [
    () =>
      `Desenvolver a compreensão dos fundamentos do módulo ${moduloCorrigido}, relacionando o percurso previsto para ${diaCorrigido} às experiências formativas já iniciadas pelo grupo.`,
    () =>
      `Estimular a aplicação orientada de procedimentos ligados a ${moduloCorrigido}, valorizando investigação, registro e participação qualificada nas propostas do dia.`,
    () =>
      `Consolidar referências técnicas e pedagógicas associadas a ${moduloCorrigido}, articulando escuta, organização e ampliação progressiva das aprendizagens.`,
    () =>
      `Explorar possibilidades de criação e resolução de desafios vinculados a ${moduloCorrigido}, favorecendo leitura crítica e construção coletiva de soluções.`,
    () =>
      `Ampliar o repertório dos jovens em torno de ${moduloCorrigido}, conectando conceitos, linguagem técnica e intencionalidade pedagógica ao desenvolvimento da semana.`,
    () =>
      `Aplicar estratégias de experimentação relacionadas a ${moduloCorrigido}, fortalecendo autonomia, colaboração e clareza na execução das atividades propostas.`,
    () =>
      `Investigar recursos e procedimentos presentes em ${moduloCorrigido}, promovendo observação atenta, interpretação e continuidade do percurso formativo.`,
    () =>
      `Aprofundar a familiaridade com práticas de ${moduloCorrigido}, favorecendo apropriação gradual, participação responsável e vínculo entre teoria e prática.`
  ]

  return [0, 1, 2].map((deslocamento) => {
    const indiceObjetivo = (indiceDiaGlobal + deslocamento * 2) % blocosObjetivos.length
    return corrigirOrtografiaInstitucional(blocosObjetivos[indiceObjetivo]())
  })
}

function montarNomeAtividade({ modulo, diaSemanaLabel }) {
  if (diaSemanaLabel === 'Terca-feira') {
    return corrigirOrtografiaInstitucional(`Abertura semanal do módulo ${modulo}`)
  }

  if (diaSemanaLabel === 'Quarta-feira') {
    return corrigirOrtografiaInstitucional(`Desenvolvimento orientado do módulo ${modulo}`)
  }

  return corrigirOrtografiaInstitucional(`Consolidação semanal do módulo ${modulo}`)
}

function montarAreasConhecimento() {
  return ['Programação', 'Raciocínio lógico', 'Cultura digital']
}

function montarRecursosMes({ recursosPadrao, modulosPrevistos }) {
  const recursos = [
    ...extrairListaTexto(recursosPadrao),
    'Computadores ou notebooks',
    'Internet para pesquisa e experimentação orientada',
    'Projetor ou tela para sistematização coletiva',
    'Quadro ou superficie de apoio para registro',
    'Materiais digitais e impressos de apoio'
  ]

  if (modulosPrevistos.some((item) => item.toLowerCase().includes('scratch'))) {
    recursos.push('Ambiente Scratch')
  }

  const recursosNormalizados = new Map()

  recursos.forEach((item) => {
    const recursoCorrigido = corrigirOrtografiaInstitucional(item)
    const chave = recursoCorrigido
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

    if (chave && !recursosNormalizados.has(chave)) {
      recursosNormalizados.set(chave, recursoCorrigido)
    }
  })

  return Array.from(recursosNormalizados.values())
}

function montarResumoPlano({ mes, ano, oficinaNome, modulosPrevistos, projetoMes }) {
  const modulosTexto =
    modulosPrevistos.length > 0
      ? modulosPrevistos.join(', ')
      : 'continuidade formativa da oficina'

  return corrigirOrtografiaInstitucional(
    `Plano mensal referente a ${mes}/${ano} para ${oficinaNome}, com foco em ${projetoMes.toLowerCase()} e organização das vivências previstas a partir de ${modulosTexto}.`
  )
}

function garantirTresParagrafos(texto) {
  const textoNormalizado = corrigirOrtografiaInstitucional(texto)
  const normalizarParagrafos = (itens) =>
    itens
    .map((item) => item.trim())
    .filter(Boolean)

  const paragrafosPorBloco = normalizarParagrafos(textoNormalizado.split(/\n\s*\n/))

  if (paragrafosPorBloco.length >= 3) {
    return paragrafosPorBloco.join('\n\n')
  }

  const paragrafosPorLinha = normalizarParagrafos(textoNormalizado.split(/\r?\n/))

  if (paragrafosPorLinha.length >= 3) {
    return paragrafosPorLinha.join('\n\n')
  }

  const frases = textoNormalizado.match(/[^.!?]+[.!?]?/g)?.map((item) => item.trim()).filter(Boolean) || []

  if (frases.length >= 3) {
    const tamanhoBase = Math.ceil(frases.length / 3)
    const blocos = []

    for (let indice = 0; indice < frases.length; indice += tamanhoBase) {
      blocos.push(frases.slice(indice, indice + tamanhoBase).join(' ').trim())
    }

    while (blocos.length < 3) {
      blocos.push(blocos[blocos.length - 1] || textoNormalizado)
    }

    return blocos.slice(0, 3).join('\n\n')
  }

  return [textoNormalizado, textoNormalizado, textoNormalizado].join('\n\n')
}

function gerarIdPlano({ oficinaId, educadorId, ano, mes }) {
  return `${oficinaId}_${educadorId}_${ano}_${String(mes).padStart(2, '0')}`
}

async function buscarPlanoAnual({ ano }) {
  const planoSnap = await adminDb.collection('plano_anual').doc(String(ano)).get()

  if (!planoSnap.exists) {
    throw new Error('Plano anual não encontrado')
  }

  return planoSnap.data() || {}
}

async function buscarDocumentoBasePlanoAulasAtivo({ oficinaId, ano, semestre }) {
  const snapshot = await adminDb
    .collection('documentos_base_plano_aulas')
    .where('oficinaId', '==', oficinaId)
    .where('ano', '==', ano)
    .where('semestre', '==', semestre)
    .where('tipo', '==', 'plano_aulas_base')
    .where('ativo', '==', true)
    .limit(1)
    .get()

  if (snapshot.empty) {
    throw new Error(
      `Nenhum documento base ativo foi encontrado para ${ano} - ${formatarSemestreLabel(semestre)}. Verifique se existe uma versão ativa do Documento Base do Plano Mensal para este período.`
    )
  }

  const doc = snapshot.docs[0]
  const data = doc.data()

  return {
    id: doc.id,
    titulo: data.titulo || '',
    versao: data.versao || null,
    conteudo: data.conteudo || '',
    eixoPedagogia: data.eixoPedagogia || '',
    recursosPadrao: Array.isArray(data.recursosPadrao) ? data.recursosPadrao : []
  }
}

async function buscarPlanoMesAnterior({ oficinaId, educadorId, ano, mes }) {
  const mesAnterior = obterMesAnterior({ ano, mes })
  const idPlanoAnterior = gerarIdPlano({
    oficinaId,
    educadorId,
    ano: mesAnterior.ano,
    mes: mesAnterior.mes
  })

  const planoAnteriorSnap = await adminDb
    .collection('planos_aulas_mensais')
    .doc(idPlanoAnterior)
    .get()

  if (!planoAnteriorSnap.exists) {
    return null
  }

  return {
    id: planoAnteriorSnap.id,
    ...planoAnteriorSnap.data()
  }
}

async function buscarModulosTrabalhadosAnteriormente({
  educadorId,
  oficinaId,
  ano,
  mes
}) {
  const limiteMesAtual = new Date(ano, mes - 1, 1)

  const snapshot = await adminDb
    .collection('registros_diarios')
    .where('uidEducador', '==', educadorId)
    .where('excluido', '==', false)
    .orderBy('data', 'desc')
    .limit(80)
    .get()

  const modulos = []

  snapshot.docs.forEach((doc) => {
    const data = doc.data()
    const dataRegistro = data?.data?.toDate ? data.data.toDate() : null

    if (!dataRegistro || dataRegistro >= limiteMesAtual) {
      return
    }

    if ((data.oficinaId || '') !== oficinaId) {
      return
    }

    const modulo = normalizarTexto(data.modulo)

    if (modulo && !modulos.includes(modulo)) {
      modulos.push(modulo)
    }
  })

  return modulos
}

async function gerarTextosPlanoComIA({
  documentoBase,
  planoAnual,
  contextoPlano,
  estruturaIA
}) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não encontrada no ambiente')
  }

  const prompt = `
Voce e um redator pedagogico institucional responsavel por complementar
um Plano de Aulas Mensal da Oficina de Programacao.

IMPORTANTE:
- A estrutura do plano ja esta definida e nao pode ser alterada.
- Nao crie, remova, reordene ou renomeie semanas.
- Nao crie, remova, reordene ou renomeie datas.
- Nao altere nome de atividade nem objetivos especificos.
- Sua funcao e preencher somente:
  1. importanciaProjetoMes
  2. apresentacao de cada dia
  3. desenvolvimento de cada dia
  4. fechamento de cada dia

REGRAS OBRIGATORIAS:
- Todo o texto deve estar no futuro.
- Nunca use a palavra "alunos".
- Use apenas termos como jovens, participantes, integrantes ou grupo.
- Linguagem institucional, formal, objetiva e pedagogica.
- Nao inclua referencias bibliograficas.
- Nao mencione inteligencia artificial, sistema ou automacao.
- Mantenha continuidade pedagogica entre mes anterior, modulo atual e projeto do mes.
- Nao copie literalmente o documento base nem o plano anual.

DOCUMENTO BASE:
${documentoBase}

PLANO ANUAL:
${planoAnual}

CONTEXTO DO PLANO:
${contextoPlano}

ESTRUTURA QUE DEVE SER COMPLEMENTADA:
${JSON.stringify(estruturaIA, null, 2)}

FORMATO OBRIGATORIO DA RESPOSTA:
- Retorne apenas JSON valido.
- Preserve exatamente a mesma estrutura recebida.
- Preencha somente os campos de texto solicitados.
- Em importanciaProjetoMes, escreva obrigatoriamente 3 paragrafos distintos.
- Estruture esses paragrafos em progressao de ideias:
  1. contexto pedagogico do mes
  2. relevancia tecnica do trabalho previsto
  3. impacto formativo esperado para os jovens
- Evite repeticao mecanica de abertura entre apresentacao, desenvolvimento e fechamento.
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Voce e um educador e redator pedagogico institucional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })
  })

  const dataIA = await response.json()
  const texto = dataIA.choices?.[0]?.message?.content

  if (!texto) {
    throw new Error('IA não retornou conteúdo para o plano mensal')
  }

  try {
    return JSON.parse(texto)
  } catch {
    const match = texto.match(/\{[\s\S]*\}/)

    if (!match) {
      throw new Error('Retorno da IA inválido para o plano mensal')
    }

    return JSON.parse(match[0])
  }
}

function combinarEstruturaComIA(estrutura, conteudoIA) {
  const importanciaProjetoMes = garantirTresParagrafos(conteudoIA?.importanciaProjetoMes)

  const semanas = estrutura.semanas.map((semana, indiceSemana) => {
    const semanaIA = conteudoIA?.semanas?.[indiceSemana] || {}

    return {
      ...semana,
      dias: semana.dias.map((dia, indiceDia) => {
        const diaIA = semanaIA?.dias?.[indiceDia] || {}

        return {
          ...dia,
          apresentacao: corrigirOrtografiaInstitucional(diaIA.apresentacao),
          desenvolvimento: corrigirOrtografiaInstitucional(diaIA.desenvolvimento),
          fechamento: corrigirOrtografiaInstitucional(diaIA.fechamento)
        }
      })
    }
  })

  return {
    importanciaProjetoMes,
    semanas
  }
}

async function salvarPlanoAulasMensal({ plano, planoExistente }) {
  const docId = gerarIdPlano({
    oficinaId: plano.oficinaId,
    educadorId: plano.educadorId,
    ano: plano.ano,
    mes: plano.mes
  })

  await adminDb.collection('planos_aulas_mensais').doc(docId).set({
    ...plano,
    criadoEm:
      planoExistente?.criadoEm || admin.firestore.FieldValue.serverTimestamp(),
    atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
  })

  return docId
}

export default async function gerarPlanoAulasMensal({
  mes,
  ano,
  observacoesMes,
  modulosPrevistos,
  educador
}) {
  const mesNumero = Number(mes)
  const anoNumero = Number(ano)
  const modulosPrevistosNormalizados = normalizarLista(modulosPrevistos)

  if (!educador?.uid || !educador?.oficinaId) {
    throw new Error('Educador autenticado sem vínculo institucional válido')
  }

  if (!mesNumero || mesNumero < 1 || mesNumero > 12 || !anoNumero) {
    throw new Error('Mês ou ano inválido')
  }

  const planoAnual = await buscarPlanoAnual({ ano: anoNumero })
  const semestre = obterSemestrePorMes(mesNumero)
  const documentoBaseAtivo = await buscarDocumentoBasePlanoAulasAtivo({
    oficinaId: educador.oficinaId,
    ano: anoNumero,
    semestre
  })
  const documentoBase = normalizarTexto(documentoBaseAtivo.conteudo)

  if (!documentoBase) {
    throw new Error('Documento base do plano de aulas não encontrado')
  }

  const referenciaMesAnterior = await buscarPlanoMesAnterior({
    oficinaId: educador.oficinaId,
    educadorId: educador.uid,
    ano: anoNumero,
    mes: mesNumero
  })

  const modulosAnteriores = await buscarModulosTrabalhadosAnteriormente({
    educadorId: educador.uid,
    oficinaId: educador.oficinaId,
    ano: anoNumero,
    mes: mesNumero
  })

  const modulosPlanejamento =
    modulosPrevistosNormalizados.length > 0
      ? modulosPrevistosNormalizados
      : modulosAnteriores.slice(0, 4)

  const calendario = gerarCalendarioPlanoAulasMensal({
    ano: anoNumero,
    mes: mesNumero
  })

  const projetoMes = montarProjetoMes(modulosPlanejamento, referenciaMesAnterior)
  const oficinaNome = nomeOficina(educador.oficinaId)
  const eixoPedagogia =
    normalizarTexto(documentoBaseAtivo.eixoPedagogia) ||
    'Percurso formativo institucional'

  let indiceModulo = 0
  let indiceDiaGlobal = 0

  const semanasBase = calendario.map((semana) => ({
    identificacao: semana.identificacao,
    periodo: semana.periodo,
    areasConhecimento: montarAreasConhecimento(),
    dias: semana.dias.map((dia) => {
      const moduloBase =
        modulosPlanejamento[indiceModulo % Math.max(modulosPlanejamento.length, 1)] ||
        'Continuidade formativa da oficina'
      const modulo = corrigirOrtografiaInstitucional(moduloBase)
      const objetivosEspecificos = montarObjetivosEspecificos({
        modulo,
        diaSemanaLabel: dia.diaSemanaLabel,
        indiceDiaGlobal
      })

      indiceModulo += 1
      indiceDiaGlobal += 1

      return {
        nomeAtividade: montarNomeAtividade({
          modulo,
          diaSemanaLabel: dia.diaSemanaLabel
        }),
        data: formatarDataInstitucional(dia.dataISO),
        objetivosEspecificos,
        apresentacao: '',
        desenvolvimento: '',
        fechamento: ''
      }
    })
  }))

  const estruturaIA = {
    importanciaProjetoMes: '',
    semanas: semanasBase.map((semana) => ({
      identificacao: semana.identificacao,
      periodo: semana.periodo,
      dias: semana.dias.map((dia) => ({
        nomeAtividade: dia.nomeAtividade,
        data: dia.data,
        objetivosEspecificos: dia.objetivosEspecificos,
        apresentacao: '',
        desenvolvimento: '',
        fechamento: ''
      }))
    }))
  }

  const contextoPlano = JSON.stringify(
    {
      mes: mesNumero,
      ano: anoNumero,
      oficina: oficinaNome,
      educador: educador.nome || '',
      eixoPedagogia,
      projetoMes,
      observacoesMes: normalizarTexto(observacoesMes),
      modulosPrevistos: modulosPlanejamento,
      modulosTrabalhadosAnteriormente: modulosAnteriores,
      referenciaMesAnterior: referenciaMesAnterior
        ? {
            mes: referenciaMesAnterior.mes,
            ano: referenciaMesAnterior.ano,
            projetoMes: referenciaMesAnterior.cabecalho?.projetoMes || '',
            resumoPlano: referenciaMesAnterior.resumoPlano || '',
            importanciaProjetoMes:
              referenciaMesAnterior.importanciaProjetoMes || ''
          }
        : null
    },
    null,
    2
  )

  const conteudoIA = await gerarTextosPlanoComIA({
    documentoBase,
    planoAnual: normalizarTexto(planoAnual.defesaProjetoAplicado),
    contextoPlano,
    estruturaIA
  })

  const estruturaFinal = combinarEstruturaComIA(
    {
      semanas: semanasBase
    },
    conteudoIA
  )

  const plano = {
    mes: mesNumero,
    ano: anoNumero,
    oficinaId: educador.oficinaId,
    oficinaNome,
    educadorId: educador.uid,
    educadorNome: educador.nome || '',
    documentoBaseId: documentoBaseAtivo.id,
    documentoBaseVersao: documentoBaseAtivo.versao,
    documentoBaseTitulo: documentoBaseAtivo.titulo,
    observacoesMes: normalizarTexto(observacoesMes),
    modulosPrevistos: modulosPlanejamento.map(corrigirOrtografiaInstitucional),
    modulosTrabalhadosAnteriormente: modulosAnteriores.map(corrigirOrtografiaInstitucional),
    referenciaMesAnterior: referenciaMesAnterior
      ? {
          mes: referenciaMesAnterior.mes,
          ano: referenciaMesAnterior.ano,
          resumoPlano: referenciaMesAnterior.resumoPlano || '',
          importanciaProjetoMes: referenciaMesAnterior.importanciaProjetoMes || '',
          projetoMes: referenciaMesAnterior.cabecalho?.projetoMes || ''
        }
      : {},
    resumoPlano: montarResumoPlano({
      mes: mesNumero,
      ano: anoNumero,
      oficinaNome,
      modulosPrevistos: modulosPlanejamento,
      projetoMes
    }),
    importanciaProjetoMes: estruturaFinal.importanciaProjetoMes,
    cabecalho: {
      titulo: 'Plano de Aulas Mensal - Oficina de Programação',
      mes: mesNumero,
      ano: anoNumero,
      oficina: oficinaNome,
      educador: educador.nome || '',
      eixoPedagogia: corrigirOrtografiaInstitucional(eixoPedagogia),
      projetoMes
    },
    semanas: estruturaFinal.semanas,
    recursosMes: montarRecursosMes({
      recursosPadrao: documentoBaseAtivo.recursosPadrao,
      modulosPrevistos: modulosPlanejamento
    })
  }

  const idPlano = gerarIdPlano({
    oficinaId: plano.oficinaId,
    educadorId: plano.educadorId,
    ano: plano.ano,
    mes: plano.mes
  })

  const planoExistente = await adminDb.collection('planos_aulas_mensais').doc(idPlano).get()

  const id = await salvarPlanoAulasMensal({
    plano,
    planoExistente: planoExistente.exists ? planoExistente.data() : null
  })

  return {
    id,
    ...plano
  }
}
