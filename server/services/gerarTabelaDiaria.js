// services/gerarTabelaDiaria.js
import fetch from 'node-fetch'

export default async function gerarTabelaDiaria({
  resumoManha,
  resumoTarde,
  temaDia,
  temaAnterior,
  tipoAula
}) {

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não encontrada no ambiente')
  }

  const registroDiario = `
Manhã:
${resumoManha || 'Não informado'}

Tarde:
${resumoTarde || 'Não informado'}

Tema da aula:
${temaDia || 'Não informado'}

Tema da aula anterior:
${temaAnterior || 'Não informado'}

Tipo de aula:
${tipoAula || 'Não informado'}
`

const prompt = `
Você é um redator pedagógico institucional responsável por registrar
formalmente as atividades da Oficina de Programação da Casa do Zezinho.

Com base exclusivamente no registro abaixo, gere exatamente 3 atividades
com seus respectivos resultados observados.

REGRAS OBRIGATÓRIAS:

- Utilize apenas informações presentes no registro.
- Linguagem institucional, formal, objetiva e avaliativa.
- Nunca utilize a palavra "alunos".
- Utilize variações adequadas como:
  "zezinhos", "Estudantes", "jovens", "participantes", "integrantes da turma", "grupo".
- Evite repetir o mesmo termo no início dos resultados.
- É proibido iniciar todos os resultados com "Os", "Os jovens",
  "Os zezinhos" ou estrutura semelhante.
- Varie a construção das frases.
- Alterne entre voz ativa e voz passiva quando adequado.
- Utilize construções como:
  "Observou-se", "Verificou-se", "Evidenciou-se",
  "Notou-se", "Houve", "Foi possível identificar",
  "A turma apresentou", "O grupo demonstrou".
- Os resultados devem estar obrigatoriamente no passado.
- Nunca utilize verbos no futuro como:
  "deve", "devem", "deveria", "será", "serão",
  "precisa", "precisam".
- Não escreva instruções.
- Não escreva orientações.
- Não escreva explicações teóricas.
- Registre apenas o que foi realizado e o que foi observado.
- Descreva evidências concretas de aprendizagem.
- Gere exatamente 3 itens.
- Use exclusivamente as chaves:
  "atividade" e "resultado".
- Retorne apenas JSON válido.

IMPORTANTE:
Os resultados não podem ter estruturas repetitivas.
Evite iniciar frases consecutivas com o mesmo sujeito ou padrão.

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
        { role: 'system', content: 'Você é um agente pedagógico institucional.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  })

  const dataIA = await response.json()
  const texto = dataIA.choices?.[0]?.message?.content

  if (!texto) {
    throw new Error('IA não retornou conteúdo')
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

  // Se vier objeto único
  if (tabela && !Array.isArray(tabela)) {
    tabela = [tabela]
  }

  // 🔥 NORMALIZA CHAVE INCORRETA "por" PARA "resultado"
  if (Array.isArray(tabela)) {
    tabela = tabela.map(item => {
      if (item.por && !item.resultado) {
        return {
          atividade: item.atividade,
          resultado: item.por
        }
      }
      return item
    })
  }

  // Se veio apenas 1 item, completa para 3
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
          resultado: 'Desenvolvimento progressivo das competências trabalhadas'
        },
        {
          atividade: 'Encerramento e consolidação do conteúdo',
          resultado: 'Fixação dos conceitos abordados durante a aula'
        }
      ]
    }
  }

  // Validação final
  if (
    !Array.isArray(tabela) ||
    tabela.length !== 3 ||
    !tabela.every(
      item =>
        typeof item.atividade === 'string' &&
        typeof item.resultado === 'string'
    )
  ) {
    throw new Error('Tabela diária inválida estruturalmente')
  }

  return tabela
}
