// services/gerarSoftSkills.js
import fetch from 'node-fetch'

export default async function gerarSoftSkills({
  softOriente,
  softCoracao
}) {
 console.log('SoftSkills IA executada')

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não encontrada')
  }

  const textoBase = `
Soft Skills – Oriente:
${softOriente || 'Não informado'}

Soft Skills – Coração:
${softCoracao || 'Não informado'}
`

  const prompt = `
Você é um agente pedagógico institucional.

Com base no texto abaixo, gere apenas UMA frase direta
indicando as soft skills desenvolvidas na aula.

Regras obrigatórias:
- Frase única
- Linguagem técnica e institucional
- Objetiva
- Sem narrativa
- Sem contextualização extensa
- Sem repetir o texto original
- Não inventar informações
- Não usar expressões como "observou-se", "durante a aula", etc.

Exemplo esperado:
"Desenvolvimento de comunicação, colaboração e postura participativa, com superação de resistência inicial."

Retorne apenas a frase.

TEXTO:
${textoBase}
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

  const data = await response.json()
  const texto = data.choices?.[0]?.message?.content

  if (!texto) {
    return 'Não informado'
  }

  return texto.trim().replace(/\.$/, '') + '.'
}
