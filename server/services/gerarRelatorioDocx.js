// services/gerarRelatorioDocx.js

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
  AlignmentType
} from "docx"

export default async function gerarRelatorioDocx(relatorio) {

  const children = []

  // ===== PARÁGRAFO INSTITUCIONAL (1.5) =====
  const paragrafoInstitucional = (texto) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: {
        line: 360,
        lineRule: "auto",
        after: 200
      },
      children: [new TextRun(texto)]
    })

  // ===== CÉLULA PADRÃO (50%) =====
  const celulaPadrao = (conteudo) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      margins: {
        top: 150,
        bottom: 150,
        left: 200,
        right: 200
      },
      children: [conteudo]
    })

  // ===== TÍTULO =====
  children.push(
    new Paragraph({
      text: relatorio.cabecalho.titulo,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  )

  children.push(
    paragrafoInstitucional(
      `Oficina de Programação - ${relatorio.cabecalho.mes}/${relatorio.cabecalho.ano}`
    )
  )

  // ===== DEFESA =====
  children.push(
    new Paragraph({
      text: "1. Defesa do Projeto Aplicado",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 }
    })
  )

  relatorio.cabecalho.defesaProjetoAplicado
    .split("\n")
    .forEach(p => {
      if (p.trim()) {
        children.push(paragrafoInstitucional(p.trim()))
      }
    })

  // ===== SEMANAS =====
  relatorio.semanas.forEach(semana => {

    children.push(
      new Paragraph({
        text: `${semana.identificador} - ${semana.periodo}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      })
    )

    semana.dias.forEach(dia => {

      children.push(
        new Paragraph({
          text: `Data: ${dia.dataFormatada}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 250, after: 100 }
        })
      )

      children.push(
        paragrafoInstitucional(`Módulo: ${dia.modulo}`),
        paragrafoInstitucional(`Tema do dia: ${dia.temaDia}`),
        paragrafoInstitucional(`Tema anterior: ${dia.temaAnterior}`),
        paragrafoInstitucional(`Soft Skills desenvolvidas: ${dia.softSkillsDesenvolvidas}`)
      )

      // ===== TABELA ATIVIDADES =====
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [

            new TableRow({
              children: [
                celulaPadrao(
                  new Paragraph({
                    children: [new TextRun({ text: "Atividades Realizadas", bold: true })]
                  })
                ),
                celulaPadrao(
                  new Paragraph({
                    children: [new TextRun({ text: "Resultados", bold: true })]
                  })
                )
              ]
            }),

            ...dia.tabelaDiaria.map(linha =>
              new TableRow({
                children: [
                  celulaPadrao(paragrafoInstitucional(linha.atividade)),
                  celulaPadrao(paragrafoInstitucional(linha.resultado))
                ]
              })
            )
          ]
        })
      )

      // ===== REGISTROS FOTOGRÁFICOS =====
      children.push(
        new Paragraph({
          text: "Registros Fotográficos",
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 250, after: 120 }
        })
      )

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [new Paragraph("Inserir foto")]
                }),
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [new Paragraph("Inserir foto")]
                }),
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [new Paragraph("Inserir foto")]
                })
              ]
            })
          ]
        })
      )

    })

    // ===== PARECER =====
    children.push(
      new Paragraph({
        text: "Parecer Técnico do Educador",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 150 }
      })
    )

    children.push(paragrafoInstitucional(semana.parecerTecnico))

    // ===== LINHA DIVISÓRIA SIMPLES =====
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun("────────────────────────────────────────────────────────────────")
        ]
      })
    )
  })

  const doc = new Document({
    sections: [{ children }]
  })

  return await Packer.toBuffer(doc)
}