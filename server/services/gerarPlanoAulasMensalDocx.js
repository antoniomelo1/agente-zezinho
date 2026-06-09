import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType
} from 'docx'

const LARGURA_TABELA_DXA = 9020
const LARGURA_CAMPO_DXA = 2200
const LARGURA_CONTEUDO_DXA = LARGURA_TABELA_DXA - LARGURA_CAMPO_DXA

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
    [/\bTerca-feira\b/g, 'Terça-feira'],
    [/\bRaciocinio\b/g, 'Raciocínio']
  ]

  return substituicoes.reduce((atual, [padrao, substituicao]) => {
    return atual.replace(padrao, substituicao)
  }, String(texto).trim())
}

function paragrafoInstitucional(texto, overrides = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      line: 360,
      lineRule: 'auto',
      after: 200
    },
    children: [new TextRun(corrigirOrtografiaInstitucional(texto))],
    ...overrides
  })
}

function paragrafoTabela(texto, overrides = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      line: 300,
      lineRule: 'auto',
      after: 80
    },
    children: [new TextRun(corrigirOrtografiaInstitucional(texto))],
    ...overrides
  })
}

function paragrafoRotulo(texto) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: corrigirOrtografiaInstitucional(texto),
        bold: true
      })
    ]
  })
}

function paragrafoEspacador() {
  return new Paragraph({
    text: '',
    spacing: { after: 180 }
  })
}

function formatarDataInstitucional(dataISO) {
  if (!dataISO || typeof dataISO !== 'string') {
    return ''
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(dataISO)) {
    return dataISO
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataISO)) {
    return dataISO.replace(/\//g, '-')
  }

  const [ano, mes, dia] = dataISO.split('-')

  if (!ano || !mes || !dia) {
    return dataISO
  }

  return `${dia}-${mes}-${ano}`
}

function validarPlanoParaDocx(plano) {
  if (!plano || typeof plano !== 'object') {
    throw new Error('Plano inválido para exportação DOCX')
  }

  if (!plano.cabecalho || typeof plano.cabecalho !== 'object') {
    throw new Error('Cabeçalho do plano não informado para exportação DOCX')
  }

  if (!Array.isArray(plano.semanas)) {
    throw new Error('Semanas do plano não informadas para exportação DOCX')
  }

  if (!plano.importanciaProjetoMes || typeof plano.importanciaProjetoMes !== 'string') {
    throw new Error('Importância do projeto no mês não informada para exportação DOCX')
  }
}

function normalizarParagrafosTabela(valor) {
  const texto = corrigirOrtografiaInstitucional(valor)

  if (!texto) {
    return [paragrafoTabela('')]
  }

  return texto
    .split(/\n\s*\n|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => paragrafoTabela(item))
}

function celulaTabela(conteudo, larguraDxa) {
  const children = Array.isArray(conteudo) ? conteudo : [conteudo]

  return new TableCell({
    width: { size: larguraDxa, type: WidthType.DXA },
    margins: {
      top: 140,
      bottom: 140,
      left: 180,
      right: 180
    },
    children: children.length > 0 ? children : [paragrafoTabela('')]
  })
}

function linhaCampoConteudo(campo, conteudo) {
  const childrenConteudo = Array.isArray(conteudo)
    ? conteudo
    : normalizarParagrafosTabela(conteudo)

  return new TableRow({
    children: [
      celulaTabela(paragrafoRotulo(campo), LARGURA_CAMPO_DXA),
      celulaTabela(childrenConteudo, LARGURA_CONTEUDO_DXA)
    ]
  })
}

function criarTabelaCampos(linhas) {
  return new Table({
    width: { size: LARGURA_TABELA_DXA, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: linhas.map(([campo, conteudo]) => linhaCampoConteudo(campo, conteudo))
  })
}

function criarTabelaAtividade({ dia, semana }) {
  const objetivos = Array.isArray(dia.objetivosEspecificos)
    ? dia.objetivosEspecificos.map((objetivo) => paragrafoTabela(`- ${objetivo}`))
    : [paragrafoTabela('')]

  return criarTabelaCampos([
    ['Data', formatarDataInstitucional(dia.data)],
    ['Nome da Atividade', dia.nomeAtividade || ''],
    ['Área do Conhecimento', (semana.areasConhecimento || []).join(', ')],
    ['Objetivos Específicos', objetivos],
    ['Apresentação da Atividade', dia.apresentacao || ''],
    ['Desenvolvimento', dia.desenvolvimento || ''],
    ['Fechamento', dia.fechamento || '']
  ])
}

function criarTabelaRecursos(recursos) {
  const linhasRecursos = recursos.length > 0 ? recursos : ['']

  return new Table({
    width: { size: LARGURA_TABELA_DXA, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [celulaTabela(paragrafoRotulo('Recurso'), LARGURA_TABELA_DXA)]
      }),
      ...linhasRecursos.map((recurso) =>
        new TableRow({
          children: [celulaTabela(normalizarParagrafosTabela(recurso), LARGURA_TABELA_DXA)]
        })
      )
    ]
  })
}

export default async function gerarPlanoAulasMensalDocx(plano) {
  validarPlanoParaDocx(plano)

  const children = []

  children.push(
    new Paragraph({
      text: corrigirOrtografiaInstitucional(plano.cabecalho?.titulo || 'Plano de Aulas Mensal'),
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 }
    })
  )

  children.push(
    criarTabelaCampos([
      ['Oficina', plano.cabecalho?.oficina || ''],
      ['Educador', plano.cabecalho?.educador || ''],
      ['Mês/Ano', `${plano.cabecalho?.mes}/${plano.cabecalho?.ano}`],
      ['Eixo da pedagogia', plano.cabecalho?.eixoPedagogia || ''],
      ['Projeto do Mês', plano.cabecalho?.projetoMes || '']
    ]),
    paragrafoEspacador()
  )

  children.push(
    new Paragraph({
      text: 'Importância do projeto no mês',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 260, after: 120 }
    })
  )

  ;(String(plano.importanciaProjetoMes || '').split(/\n\s*\n/)).forEach((paragrafo) => {
    if (paragrafo.trim()) {
      children.push(paragrafoInstitucional(paragrafo))
    }
  })

  ;(plano.semanas || []).forEach((semana) => {
    children.push(
      new Paragraph({
        text: `${semana.identificacao} - ${semana.periodo}`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 320, after: 120 }
      })
    )

    const observacoesInstitucionais = semana.observacoesInstitucionais || []

    observacoesInstitucionais.forEach((observacao) => {
      if (observacao?.texto?.trim()) {
        children.push(paragrafoInstitucional(observacao.texto.trim()))
      }
    })

    ;(semana.dias || []).forEach((dia) => {
      children.push(
        new Paragraph({
          text: `${formatarDataInstitucional(dia.data)} - ${dia.nomeAtividade}`,
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 220, after: 100 }
        }),
        criarTabelaAtividade({ dia, semana }),
        paragrafoEspacador()
      )
    })
  })

  children.push(
    new Paragraph({
      text: 'Recursos do mês',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 320, after: 120 }
    }),
    criarTabelaRecursos(plano.recursosMes || [])
  )

  const doc = new Document({
    sections: [{ children }]
  })

  return Packer.toBuffer(doc)
}
