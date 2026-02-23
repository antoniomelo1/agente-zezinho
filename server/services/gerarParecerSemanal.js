// services/gerarParecerSemanal.js
import fetch from 'node-fetch'

/**
 * Gera o Parecer Técnico Semanal do relatório pedagógico
 * com base nos registros consolidados da semana.
 */
export default async function gerarParecerSemanal(contextoSemana) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não encontrada no ambiente')
  }

  if (!contextoSemana || typeof contextoSemana !== 'string') {
    throw new Error('Contexto semanal inválido')
  }

const prompt = `
Você é um educador e redator pedagógico institucional responsável
pela elaboração de documentos oficiais da Oficina de Programação.

Sua tarefa é redigir o Parecer Técnico do Educador referente a uma semana.

CONTEXTO REAL DA SEMANA:
${contextoSemana}

PADRÃO INSTITUCIONAL OBRIGATÓRIO:
- O texto deve estar integralmente no passado
- É proibido utilizar a palavra “alunos”
- Utilize apenas: zezinhos, jovens, participantes, integrantes da turma ou grupo
- Linguagem formal, técnica e avaliativa
- Não utilize primeira pessoa
- Não utilize linguagem emocional
- Não utilize adjetivação exagerada
- Não utilize linguagem punitiva
- Não invente informações ou comportamentos

QUALIDADE TEXTUAL:
- Produza apenas UM parágrafo
- Evite iniciar frases repetidamente com o mesmo termo
- Utilize conectores institucionais adequados
- Varie a construção sintática ao longo do parágrafo
- Evite repetição estrutural
- Demonstre leitura processual do desenvolvimento pedagógico
- Destaque avanços, desafios e encaminhamentos quando pertinentes
- Utilize maturidade técnica na análise

RESTRIÇÕES:
- Não utilize listas
- Não utilize títulos
- Não mencione inteligência artificial, sistema ou automação

FORMATO DA RESPOSTA:
Retorne apenas o texto do parecer.
`

  const response = await fetch(
    'https://api.openai.com/v1/chat/completions',
    {
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
            content: 'Você é um educador e redator pedagógico institucional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4
      })
    }
  )

  const dataIA = await response.json()
  const texto = dataIA.choices?.[0]?.message?.content

  if (!texto) {
    throw new Error('IA não retornou texto para o Parecer Técnico Semanal')
  }

  return texto.trim()
}
