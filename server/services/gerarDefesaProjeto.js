// services/gerarDefesaProjeto.js
import fetch from 'node-fetch'

/**
 * Gera a Defesa do Projeto Aplicado do relatório mensal
 * com base no plano anual e nos registros reais do mês.
 */
export default async function gerarDefesaProjeto(
  defesaPlanoAnual,
  registrosMensais
) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não encontrada no ambiente')
  }

  if (!defesaPlanoAnual || typeof defesaPlanoAnual !== 'string') {
    throw new Error('Texto base do plano anual inválido')
  }

  if (!registrosMensais || typeof registrosMensais !== 'string') {
    throw new Error('Registros mensais inválidos')
  }

const prompt = `
Você é um educador e redator pedagógico institucional responsável
pela elaboração da seção Defesa do Projeto Aplicado
do Relatório de Execução Mensal da Oficina de Programação.

CONTEXTO DO PLANO ANUAL:
${defesaPlanoAnual}

REGISTROS REAIS DO MÊS:
${registrosMensais}

OBJETIVO:
Redigir a Defesa do Projeto Aplicado demonstrando coerência entre
planejamento e execução real no mês vigente.

PADRÃO INSTITUCIONAL OBRIGATÓRIO:
- O texto deve estar integralmente no passado
- É proibido utilizar a palavra “alunos”
- Utilize apenas: zezinhos, jovens, participantes, integrantes da turma ou grupo
- Linguagem formal, técnica e objetiva
- Não utilize primeira pessoa
- Não utilize linguagem promocional
- Não utilize adjetivação exagerada
- Não invente ações não registradas
- Não antecipe ações futuras
- Demonstre alinhamento entre proposta formativa e prática executada

QUALIDADE TEXTUAL:
- Produza entre 3 e 4 parágrafos
- Varie a construção sintática entre os parágrafos
- Utilize conectores institucionais formais
- Evite repetição estrutural
- Demonstre maturidade pedagógica e leitura avaliativa
- Utilize períodos bem estruturados e coesos

RESTRIÇÕES:
- Não utilize listas
- Não utilize títulos
- Não mencione inteligência artificial, sistema ou automação
- Retorne apenas o texto da defesa

FORMATO DA RESPOSTA:
Apenas o texto final da Defesa do Projeto Aplicado.
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
        temperature: 0.3
      })
    }
  )

  const dataIA = await response.json()
  const texto = dataIA.choices?.[0]?.message?.content

  if (!texto) {
    throw new Error('IA não retornou texto para a Defesa do Projeto Aplicado')
  }

  return texto.trim()
}
