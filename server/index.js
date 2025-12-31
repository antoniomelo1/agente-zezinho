import 'dotenv/config'
import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Servidor do Agente Pedagógico ativo')
})


const OPENAI_API_KEY = process.env.OPENAI_API_KEY


app.post('/analisar-aula', async (req, res) => {
  const resumoAula = req.body.resumo

  const prompt = `
Você é um agente pedagógico de apoio ao educador da Casa do Zezinho.

Contexto pedagógico:
A turma é composta por dois grupos etários distintos:
- Sala Oriente: jovens com até 15 anos
- Sala Coração: jovens a partir de 16 anos

As avaliações comportamentais (soft skills) devem respeitar
as diferenças de maturidade entre esses dois grupos,
sem comparações indevidas ou julgamentos.

Princípios obrigatórios da análise:
- Nunca julgar alunos ou turmas
- Nunca utilizar linguagem punitiva ou negativa
- Utilizar sempre tom orientador, acolhedor e profissional
- Focar na leitura pedagógica do processo, não apenas no resultado
- Considerar a continuidade entre a aula anterior e a aula atual
- Reconhecer avanços, mesmo que parciais
- Sugerir encaminhamentos práticos e realistas

Estrutura obrigatória da resposta:

1. LEITURA PEDAGÓGICA DA AULA  
Apresente uma leitura geral da aula, considerando:
- o conteúdo trabalhado
- a relação com o tema da aula anterior
- o engajamento e o ritmo da turma
- o momento formativo dos jovens

2. LEITURA COMPORTAMENTAL – SALA ORIENTE  
Analise o comportamento dos jovens da Sala Oriente,
considerando a faixa etária até 15 anos, com foco em:
- atenção
- participação
- respeito às orientações
- necessidade de mediação pedagógica

3. LEITURA COMPORTAMENTAL – SALA CORAÇÃO  
Analise o comportamento dos jovens da Sala Coração,
considerando a faixa etária a partir de 16 anos, com foco em:
- autonomia
- responsabilidade
- comunicação
- postura em ambiente formativo

4. PONTOS DE ATENÇÃO  
Liste, de forma objetiva e construtiva, os principais pontos
que merecem atenção pedagógica, sem caráter punitivo.

5. SUGESTÕES PARA A PRÓXIMA AULA  
Apresente sugestões práticas e viáveis para a próxima aula,
considerando:
- retomada de conteúdo, se necessário
- estratégias para melhorar engajamento
- adequação do ritmo e das atividades

6. TEXTO-BASE PARA RELATÓRIO PEDAGÓGICO  
Redija um parágrafo formal, coeso e adequado para registro
institucional, contemplando a aula realizada e seu contexto.

Dados da aula:
{{RESUMO_DA_AULA}}


Dados da aula:
${resumoAula}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é um agente pedagógico.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6
      })
    })

    const data = await response.json()

    const textoIA = data.choices?.[0]?.message?.content

    if (!textoIA) {
      return res.status(500).json({
        resultado: 'A IA respondeu, mas não retornou texto.'
      })
    }

    res.json({ resultado: textoIA })

  } catch (error) {
    console.error('ERRO OPENAI:', error)
    res.status(500).json({ erro: error.message })
  }
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Servidor pedagógico rodando na porta ${PORT}`)
})

