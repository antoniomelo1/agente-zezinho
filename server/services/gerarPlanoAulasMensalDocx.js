import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from 'docx'

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

function paragrafoCentralizado(texto, overrides = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: {
      after: 120
    },
    children: [new TextRun(corrigirOrtografiaInstitucional(texto))],
    ...overrides
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
    paragrafoInstitucional(`Mês/Ano: ${plano.cabecalho?.mes}/${plano.cabecalho?.ano}`),
    paragrafoInstitucional(`Oficina: ${plano.cabecalho?.oficina || ''}`),
    paragrafoInstitucional(`Educador: ${plano.cabecalho?.educador || ''}`),
    paragrafoInstitucional(
      `Eixo da pedagogia: ${plano.cabecalho?.eixoPedagogia || ''}`
    ),
    paragrafoInstitucional(`Projeto do mês: ${plano.cabecalho?.projetoMes || ''}`)
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
      paragrafoCentralizado('---', {
        spacing: { before: 320, after: 80 }
      }),
      new Paragraph({
        text: `${semana.identificacao} · ${semana.periodo}`,
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 }
      }),
      paragrafoCentralizado('---', {
        spacing: { after: 160 }
      })
    )

    children.push(
      paragrafoInstitucional(
        `Áreas do conhecimento: ${(semana.areasConhecimento || []).join(', ')}`
      )
    )

    ;(semana.dias || []).forEach((dia) => {
      children.push(
        new Paragraph({
          text: `${formatarDataInstitucional(dia.data)} · ${dia.nomeAtividade}`,
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 220, after: 100 }
        })
      )

      children.push(
        new Paragraph({
          text: 'Objetivos específicos',
          heading: HeadingLevel.HEADING_4,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 80 }
        })
      )

      ;(dia.objetivosEspecificos || []).forEach((objetivo) => {
        children.push(paragrafoInstitucional(`- ${objetivo}`))
      })

      children.push(
        new Paragraph({
          text: 'Apresentação',
          heading: HeadingLevel.HEADING_4,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 80 }
        }),
        paragrafoInstitucional(dia.apresentacao || ''),
        new Paragraph({
          text: 'Desenvolvimento',
          heading: HeadingLevel.HEADING_4,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 80 }
        }),
        paragrafoInstitucional(dia.desenvolvimento || ''),
        new Paragraph({
          text: 'Fechamento',
          heading: HeadingLevel.HEADING_4,
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 80 }
        }),
        paragrafoInstitucional(dia.fechamento || '')
      )
    })
  })

  children.push(
    new Paragraph({
      text: 'Recursos do mês',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 320, after: 120 }
    })
  )

  ;(plano.recursosMes || []).forEach((recurso) => {
    children.push(paragrafoInstitucional(`- ${recurso}`))
  })

  const doc = new Document({
    sections: [{ children }]
  })

  return Packer.toBuffer(doc)
}
