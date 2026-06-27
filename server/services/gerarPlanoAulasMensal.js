import admin, { adminDb } from '../firebaseAdmin.js'
import fetch from 'node-fetch'

import gerarCalendarioPlanoAulasMensal from './helpers/gerarCalendarioPlanoAulasMensal.js'
import { buscarOcorrenciasCalendarioAtivasPorMes } from './ocorrenciasCalendarioDataAccess.js'

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

function obterContextoFallback(dia = {}) {
  const nomeAtividade = normalizarTextoParaComparacao(dia.nomeAtividade)

  let tipoAtividade = 'desenvolvimento'

  if (nomeAtividade.startsWith('abertura semanal')) {
    tipoAtividade = 'abertura'
  } else if (nomeAtividade.startsWith('consolidacao semanal')) {
    tipoAtividade = 'consolidacao'
  }

  return { tipoAtividade }
}

function montarObjetivosEspecificosFallbackNeutro(dia) {
  const { tipoAtividade } = obterContextoFallback(dia)
  const objetivosPorTipo = {
    abertura: [
      'Reconhecer os conhecimentos prévios relacionados ao percurso da semana e formular questões para orientar a investigação.',
      'Explorar os primeiros procedimentos da proposta por meio de exemplos comentados e registros das descobertas.',
      'Organizar estratégias de participação que favoreçam autonomia, escuta e colaboração ao longo das atividades.'
    ],
    desenvolvimento: [
      'Relacionar os conceitos já estudados aos desafios previstos para esta etapa do percurso formativo.',
      'Aplicar procedimentos em uma prática acompanhada, analisando escolhas e ajustando soluções durante o processo.',
      'Fortalecer a autonomia na resolução de problemas e a colaboração na avaliação das produções realizadas.'
    ],
    consolidacao: [
      'Sistematizar os conceitos construídos durante a semana, identificando relações entre as diferentes experiências.',
      'Aprimorar a produção desenvolvida por meio de testes, revisão de procedimentos e registro das melhorias.',
      'Comunicar aprendizagens e decisões adotadas, exercitando argumentação, autonomia e avaliação coletiva.'
    ]
  }

  return objetivosPorTipo[tipoAtividade].map(corrigirOrtografiaInstitucional)
}

const ROTACAO_SEMANTICA_OBJETIVOS = [
  ['Conceitual', 'Investigativa', 'Comunicacao'],
  ['Tecnica', 'Criativa', 'Resolucao de Problemas'],
  ['Projeto/Produto', 'Colaborativa', 'Autonomia'],
  ['Reflexiva', 'Mundo do Trabalho', 'Comunicacao'],
  ['Integracao', 'Sistematizacao', 'Aplicacao em Contexto']
]

function montarOrientacaoSemanticaObjetivos({ indiceSemana, indiceDia }) {
  const categoriasBase =
    ROTACAO_SEMANTICA_OBJETIVOS[indiceSemana % ROTACAO_SEMANTICA_OBJETIVOS.length]
  const deslocamento = indiceDia % categoriasBase.length

  return categoriasBase.map((_, indice) =>
    categoriasBase[(indice + deslocamento) % categoriasBase.length]
  )
}

function normalizarTextoParaComparacao(texto) {
  return normalizarTexto(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function obterVerboInicial(objetivo) {
  return normalizarTextoParaComparacao(objetivo).split(' ')[0] || ''
}

function montarAjusteSemanticoModulo(nomeAtividade) {
  const modulo = normalizarTextoParaComparacao(extrairModuloDaAtividade(nomeAtividade))

  if (!modulo) {
    return []
  }

  if (modulo.includes('responsividade') || modulo.includes('responsivo')) {
    return ['adaptacao', 'experiencia do usuario', 'multiplos dispositivos']
  }

  if (modulo.includes('flexbox') || modulo.includes('flex box')) {
    return ['organizacao de elementos', 'alinhamento', 'distribuicao visual']
  }

  if (modulo.includes('grid')) {
    return ['layout', 'responsividade', 'organizacao visual']
  }

  if (modulo.includes('bootstrap')) {
    return ['componentes', 'estrutura de interface', 'padronizacao visual']
  }

  return []
}

function calcularSimilaridadeTextual(textoA, textoB) {
  const palavrasA = new Set(normalizarTextoParaComparacao(textoA).split(' ').filter(Boolean))
  const palavrasB = new Set(normalizarTextoParaComparacao(textoB).split(' ').filter(Boolean))

  if (palavrasA.size === 0 || palavrasB.size === 0) {
    return 0
  }

  const intersecao = Array.from(palavrasA).filter((palavra) => palavrasB.has(palavra)).length
  const uniao = new Set([...palavrasA, ...palavrasB]).size

  return intersecao / uniao
}

function extrairModuloDaAtividade(nomeAtividade) {
  const match = corrigirOrtografiaInstitucional(nomeAtividade).match(/módulo\s+(.+)$/i)
  return normalizarTexto(match?.[1])
}

function montarAliasesModulo(termo) {
  const termoNormalizado = normalizarTextoParaComparacao(termo)

  if (!termoNormalizado) {
    return {
      aliasesFortes: [],
      aliasesContextuais: []
    }
  }

  const aliasesFortes = [termoNormalizado]
  const aliasesContextuais = []
  const trechoAntesBarra = normalizarTextoParaComparacao(
    normalizarTexto(termo).split('/')[0]
  )
  const trechoAntesCom = termoNormalizado.split(/\s+com\s+/)[0].trim()

  if (trechoAntesBarra && trechoAntesBarra !== termoNormalizado) {
    aliasesFortes.push(trechoAntesBarra)
  }

  if (trechoAntesCom && trechoAntesCom !== termoNormalizado) {
    aliasesContextuais.push(trechoAntesCom)
  }

  if (termoNormalizado.includes('flexbox') || termoNormalizado.includes('flex box')) {
    aliasesFortes.push('flexbox', 'flex box')
  }

  if (termoNormalizado.includes('bootstrap grid')) {
    aliasesFortes.push('grid do bootstrap', 'grade do bootstrap')
  }

  if (termoNormalizado.includes('responsividade')) {
    if (termoNormalizado === 'responsividade') {
      aliasesFortes.push('responsividade')
    } else {
      aliasesContextuais.push('responsividade')
    }

    aliasesContextuais.push('responsivo', 'adaptacao responsiva')
  }

  if (termoNormalizado === 'bootstrap') {
    aliasesFortes.push('bootstrap')
  } else if (termoNormalizado.includes('bootstrap')) {
    aliasesContextuais.push('bootstrap')
  }

  if (termoNormalizado.includes('grid')) {
    aliasesContextuais.push('grid', 'layout', 'estrutura', 'organizacao visual')
  }

  return {
    aliasesFortes: Array.from(new Set(aliasesFortes)),
    aliasesContextuais: Array.from(new Set(aliasesContextuais))
  }
}

function contarOcorrenciasTexto(texto, termo) {
  const textoNormalizado = normalizarTextoParaComparacao(texto)
  const { aliasesFortes } = montarAliasesModulo(termo)

  if (!textoNormalizado || aliasesFortes.length === 0) {
    return 0
  }

  const padraoTermos = aliasesFortes
    .sort((termoA, termoB) => termoB.length - termoA.length)
    .map((termoEquivalente) =>
      termoEquivalente.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    .join('|')
  const regexTermos = new RegExp(
    `(?:^|\\s)(?:${padraoTermos})(?=\\s|$)`,
    'g'
  )

  return Array.from(textoNormalizado.matchAll(regexTermos)).length
}

function contarOcorrenciasModuloEmTextos(textos, dia) {
  const modulo = extrairModuloDaAtividade(dia.nomeAtividade)

  if (!modulo) {
    return 0
  }

  return textos.reduce(
    (total, texto) => total + contarOcorrenciasTexto(texto, modulo),
    0
  )
}

function motivoRepeticaoObjetivos(objetivos, dia) {
  const objetivosComparacao = objetivos.map(normalizarTextoParaComparacao)
  const objetivosUnicos = new Set(objetivosComparacao)

  if (objetivosUnicos.size !== objetivos.length) {
    return 'objetivos_identicos'
  }

  for (let indice = 0; indice < objetivos.length; indice += 1) {
    for (let proximoIndice = indice + 1; proximoIndice < objetivos.length; proximoIndice += 1) {
      if (calcularSimilaridadeTextual(objetivos[indice], objetivos[proximoIndice]) >= 0.82) {
        return 'objetivos_quase_identicos'
      }
    }
  }

  const verbosIniciais = objetivos.map(obterVerboInicial).filter(Boolean)

  if (verbosIniciais.length === objetivos.length && new Set(verbosIniciais).size === 1) {
    return 'verbo_inicial_repetido'
  }

  const modulo = extrairModuloDaAtividade(dia.nomeAtividade)
  const repeticoesModulo = modulo
    ? objetivos.reduce(
      (total, objetivo) => total + contarOcorrenciasTexto(objetivo, modulo),
      0
    )
    : 0

  if (repeticoesModulo > 1) {
    return 'modulo_repetido_em_excesso'
  }

  return ''
}

function motivoObjetivoInvalido(objetivo) {
  if (typeof objetivo !== 'string') {
    return 'objetivo_nao_textual'
  }

  const texto = corrigirOrtografiaInstitucional(objetivo)
  const tamanho = texto.length

  if (tamanho < 40) {
    return 'objetivo_curto'
  }

  if (tamanho > 280) {
    return 'objetivo_longo'
  }

  if (/\balunos\b/i.test(texto)) {
    return 'termo_institucional_bloqueado'
  }

  return ''
}

function normalizarObjetivosEspecificosIA(objetivosIA, dia) {
  const objetivosFallback = montarObjetivosEspecificosFallbackNeutro(dia)

  if (!Array.isArray(objetivosIA)) {
    console.warn('Fallback de objetivos especificos aplicado.', {
      data: dia.data,
      nomeAtividade: dia.nomeAtividade,
      motivo: 'estrutura_invalida'
    })

    return objetivosFallback
  }

  let houveFallback = objetivosIA.length !== 3
  const motivosFallback = objetivosIA.length !== 3 ? ['quantidade_invalida'] : []

  const objetivosNormalizados = objetivosFallback.map((objetivoFallback, indice) => {
    const objetivoIA = objetivosIA[indice]
    const motivoInvalido = motivoObjetivoInvalido(objetivoIA)

    if (motivoInvalido) {
      houveFallback = true
      motivosFallback.push(`objetivo_${indice + 1}_${motivoInvalido}`)
      return objetivoFallback
    }

    return corrigirOrtografiaInstitucional(objetivoIA)
  })

  const motivoRepeticao = motivoRepeticaoObjetivos(objetivosNormalizados, dia)

  if (motivoRepeticao) {
    console.warn('Fallback de objetivos especificos aplicado por repeticao.', {
      data: dia.data,
      nomeAtividade: dia.nomeAtividade,
      motivo: motivoRepeticao
    })

    return objetivosFallback
  }

  if (houveFallback) {
    console.warn('Fallback parcial de objetivos especificos aplicado.', {
      data: dia.data,
      nomeAtividade: dia.nomeAtividade,
      motivo: motivosFallback.join(',')
    })
  }

  return objetivosNormalizados
}

function montarTextosNarrativosFallbackNeutro(dia) {
  const { tipoAtividade } = obterContextoFallback(dia)
  const textosPorTipo = {
    abertura: {
      apresentacao:
        'A semana será iniciada com a mobilização dos conhecimentos prévios do grupo e a apresentação do desafio formativo que orientará o percurso.',
      desenvolvimento:
        'Os jovens participarão de uma exploração inicial acompanhada, registrando hipóteses, dúvidas e possíveis caminhos para a realização da proposta.',
      fechamento:
        'O encontro será concluído com a organização das descobertas iniciais e a definição dos próximos passos da semana.'
    },
    desenvolvimento: {
      apresentacao:
        'O encontro será iniciado pela conexão entre as aprendizagens anteriores e o desafio previsto para esta etapa do percurso.',
      desenvolvimento:
        'Os participantes realizarão uma prática acompanhada, tomando decisões, testando possibilidades e registrando os ajustes feitos durante a produção.',
      fechamento:
        'A atividade será encerrada com a análise das soluções construídas e a organização de encaminhamentos para o avanço do trabalho.'
    },
    consolidacao: {
      apresentacao:
        'A atividade será aberta com a recuperação dos principais aprendizados da semana e a apresentação dos critérios de revisão da produção.',
      desenvolvimento:
        'O grupo revisará procedimentos e resultados, realizando testes e aprimoramentos que evidenciem a evolução alcançada no percurso.',
      fechamento:
        'O encerramento favorecerá a socialização das produções, a síntese das aprendizagens e o registro de aspectos a serem retomados.'
    }
  }

  return textosPorTipo[tipoAtividade]
}

function normalizarTextosNarrativosIA(diaIA, dia) {
  const textosNarrativos = {
    apresentacao: corrigirOrtografiaInstitucional(diaIA.apresentacao),
    desenvolvimento: corrigirOrtografiaInstitucional(diaIA.desenvolvimento),
    fechamento: corrigirOrtografiaInstitucional(diaIA.fechamento)
  }

  const contagensPorCampo = {
    apresentacao: contarOcorrenciasModuloEmTextos(
      [textosNarrativos.apresentacao],
      dia
    ),
    desenvolvimento: contarOcorrenciasModuloEmTextos(
      [textosNarrativos.desenvolvimento],
      dia
    ),
    fechamento: contarOcorrenciasModuloEmTextos(
      [textosNarrativos.fechamento],
      dia
    )
  }
  const repeticoesModulo = Object.values(contagensPorCampo).reduce(
    (total, quantidade) => total + quantidade,
    0
  )
  const repeticaoNoMesmoCampo = Object.values(contagensPorCampo).some(
    (quantidade) => quantidade > 1
  )
  const moduloNosTresCampos = Object.values(contagensPorCampo).every(
    (quantidade) => quantidade > 0
  )

  if (repeticoesModulo > 2 || repeticaoNoMesmoCampo || moduloNosTresCampos) {
    console.warn('Fallback narrativo aplicado por repeticao do modulo.', {
      data: dia.data,
      nomeAtividade: dia.nomeAtividade,
      motivo: 'modulo_repetido_em_textos_narrativos',
      repeticoesModulo,
      contagensPorCampo
    })

    return montarTextosNarrativosFallbackNeutro(dia)
  }

  return textosNarrativos
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

function montarRecursosMes({ recursosPadrao }) {
  return extrairListaTexto(recursosPadrao)
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
- Nao altere nome de atividade.
- Sua funcao e preencher somente:
  1. importanciaProjetoMes
  2. objetivosEspecificos de cada dia
  3. apresentacao de cada dia
  4. desenvolvimento de cada dia
  5. fechamento de cada dia

REGRAS OBRIGATORIAS:
- Todo o texto deve estar no futuro.
- Nunca use a palavra "alunos".
- Use apenas termos como jovens, participantes, integrantes ou grupo.
- Linguagem institucional, formal, objetiva e pedagogica.
- Nao inclua referencias bibliograficas.
- Nao mencione inteligencia artificial, sistema ou automacao.
- Mantenha continuidade pedagogica entre mes anterior, modulo atual e projeto do mes.
- Nao copie literalmente o documento base nem o plano anual.
- Em objetivosEspecificos, escreva exatamente 3 objetivos por dia.
- O primeiro objetivo deve focar compreensao ou reconhecimento e pode mencionar o nome do modulo quando isso for necessario.
- O segundo objetivo nao deve repetir o nome do modulo; deve focar pratica, procedimento, aplicacao ou producao.
- O terceiro objetivo nao deve repetir o nome do modulo; deve focar autonomia, colaboracao, reflexao, sistematizacao ou transferencia para o projeto.
- Os tres objetivos devem cumprir funcoes diferentes: compreender ou reconhecer; aplicar ou desenvolver; sistematizar, colaborar, refletir ou transferir para o projeto.
- Nos objetivos 2 e 3, substitua a repeticao literal do modulo por expressoes como o recurso trabalhado, a estrutura estudada, a proposta pratica, a organizacao visual, a solucao desenvolvida, os conceitos explorados ou a construcao realizada.
- O modulo do dia deve servir como contexto, sem obrigatoriedade de repetir seu nome em todos os objetivos.
- O nome do modulo pode aparecer no maximo uma vez entre os tres objetivos do mesmo dia.
- Priorize conceitos, praticas e competencias em vez de repetir literalmente o titulo do modulo.
- Os objetivos devem parecer escritos por um educador, nao por um template.
- Quando o dia trouxer orientacaoSemantica, use as categorias apenas como referencia interna para redigir os tres objetivos.
- Nao escreva o nome das categorias de forma mecanica; traduza cada categoria em intencao pedagogica concreta.
- Quando houver ajustesModulo em orientacaoSemantica, use-os apenas como enfase complementar do conteudo trabalhado.
- Varie os verbos iniciais e a estrutura das frases entre os tres objetivos do mesmo dia.
- Evite objetivos genericos que serviriam para qualquer aula.
- Sempre que pertinente, conecte os objetivos ao Projeto do Mes, Observacoes do Educador, Eixo da Pedagogia, modulo trabalhado e historico recente.
- No bloco completo da atividade, considerando objetivosEspecificos, apresentacao, desenvolvimento e fechamento, o nome do modulo deve aparecer no maximo 3 vezes.
- Nos campos apresentacao, desenvolvimento e fechamento somados, o nome do modulo pode aparecer no maximo 2 vezes e no maximo uma vez por campo.
- Em apresentacao, desenvolvimento e fechamento, evite repeticao mecanica do nome tecnico do modulo; use as mencoes necessarias para clareza e priorize conceitos, praticas, recursos, desafios, producao, competencias e reflexao.

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
- Nao altere campos de orientacaoSemantica quando eles existirem; eles sao apenas contexto interno.
- Em objetivosEspecificos, retorne sempre um array com exatamente 3 strings nao vazias.
- Em importanciaProjetoMes, escreva obrigatoriamente 3 paragrafos distintos.
- Estruture esses paragrafos em progressao de ideias:
  1. contexto pedagogico do mes
  2. relevancia tecnica do trabalho previsto
  3. impacto formativo esperado para os jovens
- Evite repeticao mecanica de abertura entre objetivos, apresentacao, desenvolvimento e fechamento.
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
        const textosNarrativos = normalizarTextosNarrativosIA(diaIA, dia)

        return {
          ...dia,
          objetivosEspecificos: normalizarObjetivosEspecificosIA(
            diaIA.objetivosEspecificos,
            dia
          ),
          apresentacao: textosNarrativos.apresentacao,
          desenvolvimento: textosNarrativos.desenvolvimento,
          fechamento: textosNarrativos.fechamento
        }
      })
    }
  })

  return {
    importanciaProjetoMes,
    semanas
  }
}

function montarConteudoPlanoFallback({ semanasBase, projetoMes }) {
  return {
    importanciaProjetoMes: [
      `O mes sera organizado em continuidade ao projeto ${projetoMes}, preservando a intencionalidade pedagogica da Oficina de Programacao e o acompanhamento do percurso formativo do grupo.`,
      'As atividades previstas deverao favorecer a articulacao entre conceitos, praticas orientadas e registros do processo, mantendo relacao com os modulos planejados para o periodo.',
      'Espera-se que os jovens avancem na compreensao tecnica, na participacao qualificada e na construcao gradual de autonomia durante as vivencias propostas.'
    ].join('\n\n'),
    semanas: semanasBase.map((semana) => ({
      dias: semana.dias.map((dia) => ({
        objetivosEspecificos: montarObjetivosEspecificosFallbackNeutro(dia),
        ...montarTextosNarrativosFallbackNeutro(dia)
      }))
    }))
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

  const ocorrenciasCalendario = await buscarOcorrenciasCalendarioAtivasPorMes({
    ano: anoNumero,
    mes: mesNumero,
    oficinaId: educador.oficinaId
  })

  const calendario = gerarCalendarioPlanoAulasMensal({
    ano: anoNumero,
    mes: mesNumero,
    oficinaId: educador.oficinaId,
    ocorrencias: ocorrenciasCalendario
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
    observacoesInstitucionais: semana.observacoesInstitucionais || [],
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
    semanas: semanasBase.map((semana, indiceSemana) => ({
      identificacao: semana.identificacao,
      periodo: semana.periodo,
      dias: semana.dias.map((dia, indiceDia) => ({
        nomeAtividade: dia.nomeAtividade,
        data: dia.data,
        orientacaoSemantica: {
          categoriasObjetivos: montarOrientacaoSemanticaObjetivos({
            indiceSemana,
            indiceDia
          }),
          ajustesModulo: montarAjusteSemanticoModulo(dia.nomeAtividade)
        },
        objetivosEspecificos: ['', '', ''],
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

  let conteudoIA

  try {
    conteudoIA = await gerarTextosPlanoComIA({
      documentoBase,
      planoAnual: normalizarTexto(planoAnual.defesaProjetoAplicado),
      contextoPlano,
      estruturaIA
    })
  } catch (error) {
    console.error('Falha ao gerar textos do plano mensal com IA. Aplicando fallback.', error)
    conteudoIA = montarConteudoPlanoFallback({
      semanasBase,
      projetoMes
    })
  }

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
      recursosPadrao: documentoBaseAtivo.recursosPadrao
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
