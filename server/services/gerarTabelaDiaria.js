import fetch from 'node-fetch'

export default async function gerarTabelaDiaria({
  resumoManha,
  resumoTarde,
  temaDiaManha,
  temaDiaTarde,
  temaDia,
  temaAnterior,
  tipoAula
}) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY nao encontrada no ambiente')
  }

  const registroDiario = `
Tema da manha:
${temaDiaManha || 'Nao informado'}

Tema da tarde:
${temaDiaTarde || 'Nao informado'}

Tema consolidado do dia:
${temaDia || 'Nao informado'}

Manha:
${resumoManha || 'Nao informado'}

Tarde:
${resumoTarde || 'Nao informado'}

Tema da aula anterior:
${temaAnterior || 'Nao informado'}

Tipo de aula:
${tipoAula || 'Nao informado'}
`

  const prompt = `
Voce e um redator pedagogico institucional responsavel por registrar
formalmente as atividades da Oficina de Programacao da Casa do Zezinho.

Com base exclusivamente no registro abaixo, gere exatamente 3 atividades
com seus respectivos resultados observados.

REGRAS OBRIGATORIAS:

- Utilize apenas informacoes presentes no registro.
- Trate tema da manha e tema da tarde como fontes principais.
- Use o tema consolidado do dia apenas como compatibilidade quando necessario.
- Quando houver divergencia entre o tema consolidado e os temas por periodo, priorize sempre os temas da manha e da tarde.
- Nao use o tema consolidado do dia para sobrescrever ou reinterpretar os temas por periodo.
- Se o tema consolidado estiver ausente, trabalhe normalmente apenas com os temas por periodo.
- Nao invente informacoes para compensar ausencia, resumo incompleto ou divergencia no tema consolidado do dia.
- Linguagem institucional, formal, objetiva e avaliativa.
- Nunca utilize a palavra "alunos".
- Utilize variacoes adequadas como:
  "zezinhos", "jovens", "participantes", "integrantes da turma", "grupo".
- Evite repetir o mesmo termo no inicio dos resultados.
- Varie a construcao das frases.
- Os resultados devem estar obrigatoriamente no passado.
- Nao escreva instrucoes, orientacoes ou explicacoes teoricas.
- Registre apenas o que foi realizado e o que foi observado.
- Descreva evidencias concretas de aprendizagem.
- Gere exatamente 3 itens.
- Use exclusivamente as chaves:
  "atividade" e "resultado".
- Retorne apenas JSON valido.

FORMATO EXATO:

[
  { "atividade": "texto", "resultado": "texto" },
  { "atividade": "texto", "resultado": "texto" },
  { "atividade": "texto", "resultado": "texto" }
]

REGISTRO:
${registroDiario}
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
        { role: 'system', content: 'Voce e um agente pedagogico institucional.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  })

  const dataIA = await response.json()
  const texto = dataIA.choices?.[0]?.message?.content

  if (!texto) {
    throw new Error('IA nao retornou conteudo')
  }

  let tabela = null

  try {
    tabela = JSON.parse(texto)
  } catch {
    const match = texto.match(/\[[\s\S]*\]/)
    if (match) {
      tabela = JSON.parse(match[0])
    }
  }

  if (tabela && !Array.isArray(tabela)) {
    tabela = [tabela]
  }

  if (Array.isArray(tabela)) {
    tabela = tabela.map((item) => {
      if (item.por && !item.resultado) {
        return {
          atividade: item.atividade,
          resultado: item.por
        }
      }

      return item
    })
  }

  if (Array.isArray(tabela) && tabela.length === 1) {
    const item = tabela[0]

    if (
      typeof item.atividade === 'string' &&
      typeof item.resultado === 'string'
    ) {
      tabela = [
        {
          atividade: item.atividade,
          resultado: item.resultado
        },
        {
          atividade: 'Continuidade das atividades propostas',
          resultado: 'Desenvolvimento progressivo das competencias trabalhadas'
        },
        {
          atividade: 'Encerramento e consolidacao do conteudo',
          resultado: 'Fixacao dos conceitos abordados durante a aula'
        }
      ]
    }
  }

  if (
    !Array.isArray(tabela) ||
    tabela.length !== 3 ||
    !tabela.every(
      (item) =>
        typeof item.atividade === 'string' &&
        typeof item.resultado === 'string'
    )
  ) {
    throw new Error('Tabela diaria invalida estruturalmente')
  }

  return tabela
}
