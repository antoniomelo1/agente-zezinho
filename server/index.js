import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

import requireAuth from './middlewares/requireAuth.js'
import requireRole from './middlewares/requireRole.js'
import { ROLES } from './constants/roles.js'

import gerarTabelaDiaria from './services/gerarTabelaDiaria.js'
import gerarParecerSemanal from './services/gerarParecerSemanal.js'
import gerarDefesaProjeto from './services/gerarDefesaProjeto.js'
import { gerarRelatorioMensal } from './services/gerarRelatorioMensal.js'
import gerarRelatorioDocx from './services/gerarRelatorioDocx.js'
import criarEducadorInstitucional from './services/criarEducadorInstitucional.js'
import ativarEducadorAposRedefinicao from './services/ativarEducadorAposRedefinicao.js'
import reenviarConviteEducador from './services/reenviarConviteEducador.js'
import listarEducadores from './services/listarEducadores.js'
import salvarRegistroDiario from './services/salvarRegistroDiario.js'
import listarLeituraOperacionalCoordenador from './services/listarLeituraOperacionalCoordenador.js'

console.log(
  'OPENAI_API_KEY carregada?',
  process.env.OPENAI_API_KEY ? 'SIM' : 'NÃO'
)

const app = express()
app.use(cors())
app.use(express.json())

// ======================================================
// STATUS
// ======================================================

app.get('/', (req, res) => {
  res.send('Servidor do Agente Pedagógico ativo')
})

app.get('/ping', (req, res) => {
  res.json({ status: 'ok' })
})

// ======================================================
// USUARIOS
// ======================================================

app.post(
  '/usuarios/educadores',
  requireAuth,
  requireRole([ROLES.COORDENADOR]),
  async (req, res) => {
    try {
      const { nome, email, oficinaId } = req.body

      const resultado = await criarEducadorInstitucional({
        nome,
        email,
        oficinaId,
        criadoPorUid: req.currentUser.uid
      })

      res.status(201).json({
        mensagem: 'Educador criado com sucesso',
        ...resultado
      })
    } catch (error) {
      console.error(error)

      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({ erro: 'Email ja cadastrado' })
      }

      if (error.message === 'Nome, email e oficinaId sao obrigatorios') {
        return res.status(400).json({ erro: error.message })
      }

      res.status(500).json({ erro: 'Erro ao criar educador' })
    }
  }
)

app.get(
  '/usuarios/educadores',
  requireAuth,
  requireRole([ROLES.COORDENADOR]),
  async (req, res) => {
    try {
      const educadores = await listarEducadores()

      res.json({ educadores })
    } catch (error) {
      console.error(error)
      res.status(500).json({ erro: 'Erro ao listar educadores' })
    }
  }
)

app.post('/usuarios/ativar-primeiro-acesso', requireAuth, async (req, res) => {
  try {
    const resultado = await ativarEducadorAposRedefinicao({
      uid: req.auth.uid,
      email: req.auth.email
    })

    res.json({
      mensagem: 'Primeiro acesso ativado com sucesso',
      ...resultado
    })
  } catch (error) {
    console.error(error)

    if (
      error.message === 'Usuario sem cadastro institucional' ||
      error.message === 'Apenas educadores podem concluir primeiro acesso' ||
      error.message === 'Email autenticado divergente do cadastro institucional' ||
      error.message === 'Usuario inativo' ||
      error.message === 'Usuario nao esta pendente de ativacao'
    ) {
      return res.status(403).json({ erro: error.message })
    }

    if (error.message === 'Primeiro acesso ja concluido') {
      return res.status(409).json({ erro: error.message })
    }

    if (error.message === 'Uid obrigatorio para ativacao') {
      return res.status(400).json({ erro: error.message })
    }

    res.status(500).json({ erro: 'Erro ao ativar primeiro acesso' })
  }
})

app.post(
  '/coordenador/educadores/:uid/reenviar-convite',
  requireAuth,
  requireRole([ROLES.COORDENADOR]),
  async (req, res) => {
    try {
      const resultado = await reenviarConviteEducador({
        uid: req.params.uid
      })

      res.json({
        mensagem: 'Convite reenviado com sucesso',
        ...resultado
      })
    } catch (error) {
      console.error(error)

      if (
        error.message === 'Educador nao encontrado' ||
        error.message === 'Usuario informado nao e educador' ||
        error.message === 'Educador inativo' ||
        error.message ===
          'Reenvio disponivel apenas para educador pendente de ativacao'
      ) {
        return res.status(404).json({ erro: error.message })
      }

      if (error.message === 'Uid obrigatorio para reenvio') {
        return res.status(400).json({ erro: error.message })
      }

      res.status(500).json({ erro: 'Erro ao reenviar convite' })
    }
  }
)

app.get(
  '/coordenador/leitura-operacional',
  requireAuth,
  requireRole([ROLES.COORDENADOR]),
  async (req, res) => {
    try {
      const leitura = await listarLeituraOperacionalCoordenador()
      res.json(leitura)
    } catch (error) {
      console.error(error)
      res.status(500).json({ erro: 'Erro ao carregar leitura operacional' })
    }
  }
)


// ======================================================
// ANALISAR AULA
// ======================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

app.post(
  '/registros-diarios',
  requireAuth,
  requireRole([ROLES.EDUCADOR]),
  async (req, res) => {
    try {
      const resultado = await salvarRegistroDiario({
        payload: req.body,
        educador: req.currentUser
      })

      res.status(201).json({
        mensagem: 'Registro diario salvo com sucesso',
        ...resultado
      })
    } catch (error) {
      console.error(error)

      if (
        error.message === 'Data obrigatoria' ||
        error.message === 'Data invalida' ||
        error.message === 'Modulo e ao menos um tema sao obrigatorios' ||
        error.message === 'Ao menos um resumo deve ser informado'
      ) {
        return res.status(400).json({ erro: error.message })
      }

      res.status(500).json({ erro: 'Erro ao salvar registro diario' })
    }
  }
)

app.post(
  '/analisar-aula',
  requireAuth,
  requireRole([ROLES.EDUCADOR]),
  async (req, res) => {
    const resumoAula = req.body.resumo

    const prompt = `
Você é um agente pedagógico de apoio ao educador da Casa do Zezinho.

Contexto pedagógico:
A turma é composta por dois grupos etários distintos:
- Oriente: jovens com até 15 anos
- Coração: jovens a partir de 16 anos

As avaliações comportamentais (soft skills) devem respeitar
as diferenças de maturidade entre esses dois grupos,
sem comparações indevidas ou julgamentos.

Princípios obrigatórios da análise:
- Nunca julgar jovens ou turmas
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

2. LEITURA COMPORTAMENTAL – ORIENTE  
Analise o comportamento dos jovens da Oriente,
considerando a faixa etária até 15 anos, com foco em:
- atenção
- participação
- respeito às orientações
- necessidade de mediação pedagógica

3. LEITURA COMPORTAMENTAL – CORAÇÃO  
Analise o comportamento dos jovens da Coração,
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

Princípios:
- Linguagem acolhedora
- Sem julgamento
- Leitura pedagógica do processo

Dados da aula:
${resumoAula}
`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
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
        return res.status(500).json({ erro: 'IA não retornou texto.' })
      }

      res.json({ resultado: textoIA })
    } catch (error) {
      console.error(error)
      res.status(500).json({ erro: error.message })
    }
  }
)

// ======================================================
// GERAR TABELA DIÁRIA
// ======================================================

app.post(
  '/gerar-tabela-diaria',
  requireAuth,
  requireRole([ROLES.EDUCADOR]),
  async (req, res) => {
    try {
      const resultado = await gerarTabelaDiaria(req.body)
      res.json(resultado)
    } catch (error) {
      console.error(error)
      res.status(500).json({ erro: error.message })
    }
  }
)

// ======================================================
// GERAR RELATÓRIO MENSAL
// PRIMEIRA ROTA PROTEGIDA DA FASE 1
// ======================================================

app.post(
  '/gerar-relatorio-mensal',
  requireAuth,
  requireRole([ROLES.EDUCADOR]),
  async (req, res) => {
    try {
      const { ano, mes } = req.body

      if (!ano || !mes || mes < 1 || mes > 12) {
        return res.status(400).json({ erro: 'Ano ou mês inválido' })
      }

      const relatorio = await gerarRelatorioMensal({
        ano: Number(ano),
        mes: Number(mes)
      })

      res.json(relatorio)
    } catch (error) {
      console.error(error)
      res.status(500).json({ erro: error.message })
    }
  }
)

app.post(
  '/exportar-relatorio-docx',
  requireAuth,
  requireRole([ROLES.EDUCADOR]),
  async (req, res) => {
    try {
      const relatorio = req.body

      if (!relatorio) {
        return res.status(400).json({ erro: 'Relatório não enviado' })
      }

      const buffer = await gerarRelatorioDocx(relatorio)

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )

      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Relatorio_Execucao_Mensal.docx'
      )

      res.send(buffer)
    } catch (erro) {
      console.error(erro)
      res.status(500).json({ erro: 'Erro ao exportar DOCX' })
    }
  }
)

// ======================================================
// START
// ======================================================

app.listen(3001, '0.0.0.0', () => {
  console.log('Servidor pedagógico rodando em http://127.0.0.1:3001')
})
