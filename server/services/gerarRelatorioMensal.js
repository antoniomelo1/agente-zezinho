// services/gerarRelatorioMensal.js
import gerarSoftSkills from './gerarSoftSkills.js'
import gerarTabelaDiaria from './gerarTabelaDiaria.js'
import gerarParecerSemanal from './gerarParecerSemanal.js'
import gerarDefesaProjeto from './gerarDefesaProjeto.js'
import { db } from '../firebase.js'

import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'

export async function gerarRelatorioMensal({ mes, ano }) {
  if (!mes || !ano) {
    throw new Error('Mês e ano são obrigatórios')
  }

  const mesNumero = Number(mes)
  const anoNumero = Number(ano)

  if (mesNumero < 1 || mesNumero > 12) {
    throw new Error('Mês inválido')
  }

  const mesStr = String(mesNumero).padStart(2, '0')

  const dataInicio = new Date(`${anoNumero}-${mesStr}-01T00:00:00`)
  const dataFim = new Date(anoNumero, mesNumero, 0, 23, 59, 59)

  const registrosRef = collection(db, 'registros_diarios')

  const q = query(
    registrosRef,
    where('data', '>=', Timestamp.fromDate(dataInicio)),
    where('data', '<=', Timestamp.fromDate(dataFim)),
    orderBy('data')
  )

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    throw new Error('Nenhum registro diário encontrado para o período')
  }

  const registros = snapshot.docs.map(d => {
    const dados = d.data()

    return {
      ...dados,
      dataISO: dados.data.toDate().toISOString().substring(0, 10),
      resumoManha: dados.resumoManha || '',
      resumoTarde: dados.resumoTarde || '',
      temaDia: dados.temaDia || '',
      temaAnterior: dados.temaAnterior || '',
      tipoAula: dados.tipoAula || '',
      modulo: dados.modulo || 'Não informado',
      softOriente: dados.softOriente || '',
      softCoracao: dados.softCoracao || '',
      fotos: Array.isArray(dados.fotos) ? dados.fotos : []
    }
  })

  registros.sort((a, b) => new Date(a.dataISO) - new Date(b.dataISO))

  const planoRef = doc(db, 'plano_anual', String(anoNumero))
  const planoSnap = await getDoc(planoRef)

  if (!planoSnap.exists()) {
    throw new Error('Plano anual não encontrado')
  }

  const textoBaseDefesa =
    planoSnap.data().defesaProjetoAplicado || ''

  const semanasAgrupadas = agruparPorSemanaPedagogica(registros)

  const semanasProcessadas = []
  const resumosDoMes = []

  for (const semana of semanasAgrupadas) {
    const diasProcessados = []
    const resumosSemana = []
    const fotosSemana = []

    for (const dia of semana.dias) {
      const resumoPedagogico = montarResumoPedagogico(dia)

      const tabela = await gerarTabelaDiaria({
        resumoManha: dia.resumoManha,
        resumoTarde: dia.resumoTarde,
        temaDia: dia.temaDia,
        temaAnterior: dia.temaAnterior,
        tipoAula: dia.tipoAula
      })

      diasProcessados.push({
        dataISO: dia.dataISO,
        dataFormatada: formatarDataBR(dia.dataISO),
        modulo: dia.modulo,
        temaDia: dia.temaDia || 'Não informado',
        temaAnterior: dia.temaAnterior || 'Não informado',
        softSkillsDesenvolvidas: await gerarSoftSkills({
          softOriente: dia.softOriente,
          softCoracao: dia.softCoracao
        }),
        tabelaDiaria: tabela,
        fotos: dia.fotos
      })

      fotosSemana.push(...dia.fotos)
      resumosSemana.push(resumoPedagogico)
      resumosDoMes.push(resumoPedagogico)
    }

    const parecerTecnico =
      resumosSemana.length > 0
        ? await gerarParecerSemanal(resumosSemana.join('\n'))
        : ''

    semanasProcessadas.push({
      identificador: semana.label,
      periodo: montarPeriodoOrdenado(semana.inicio, semana.fim),
      dias: diasProcessados,
      parecerTecnico: parecerTecnico || '',
      fotos: fotosSemana.slice(0, 3)
    })
  }

  const defesaProjetoAplicado = await gerarDefesaProjeto(
    textoBaseDefesa,
    resumosDoMes.join('\n')
  )

  return {
    cabecalho: {
      titulo: 'Relatório de Execução Mensal – Oficina de Programação',
      mes: mesNumero,
      ano: anoNumero,
      defesaProjetoAplicado: defesaProjetoAplicado || ''
    },
    semanas: semanasProcessadas
  }
}

/* =========================
   FUNÇÕES AUXILIARES
========================= */

function montarResumoPedagogico(registro) {
  return `
Módulo: ${registro.modulo || 'Não informado'}
Tema do dia: ${registro.temaDia || 'Não informado'}

Manhã:
${registro.resumoManha || 'Sem registro.'}

Tarde:
${registro.resumoTarde || 'Sem registro.'}

Soft Skills – Oriente:
${registro.softOriente || 'Não informado'}

Soft Skills – Coração:
${registro.softCoracao || 'Não informado'}
`.trim()
}

function sintetizarSoftSkills(oriente, coracao) {
  const lista = [oriente, coracao]
    .filter(Boolean)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  if (lista.length === 0) return 'Não informado'

  return lista.join(', ')
}

function agruparPorSemanaPedagogica(registros) {
  const semanas = []
  let grupoAtual = {
    inicio: null,
    fim: null,
    dias: []
  }

  for (const registro of registros) {

    // Ignora dias que não sejam terça, quarta ou quinta
    const data = new Date(registro.dataISO + 'T00:00:00')
    const diaSemana = data.getDay()

    if (![2, 3, 4].includes(diaSemana)) continue

    // Se grupo está vazio, inicia
    if (grupoAtual.dias.length === 0) {
      grupoAtual.inicio = registro.dataISO
    }

    grupoAtual.dias.push(registro)
    grupoAtual.fim = registro.dataISO

    // 🔥 Se atingiu 3 dias, fecha grupo
    if (grupoAtual.dias.length === 3) {
      semanas.push({ ...grupoAtual })
      grupoAtual = {
        inicio: null,
        fim: null,
        dias: []
      }
    }
  }

  // 🔥 Se sobrou grupo incompleto no final do mês, fecha mesmo assim
  if (grupoAtual.dias.length > 0) {
    semanas.push({ ...grupoAtual })
  }

  // Identificador sequencial
  semanas.forEach((s, i) => {
    s.label = `Semana ${String(i + 1).padStart(2, '0')}`
  })

  return semanas
}

function formatarDataBR(dataISO) {
  const [ano, mes, dia] = dataISO.split('-')
  return `${dia}/${mes}/${ano}`
}

function montarPeriodoOrdenado(inicio, fim) {
  const dataInicio = new Date(inicio + 'T00:00:00')
  const dataFim = new Date(fim + 'T00:00:00')

  const formatar = (dataISO) => {
    const [ano, mes, dia] = dataISO.split('-')
    return `${dia}/${mes}/${ano}`
  }

  if (dataInicio > dataFim) {
    return `${formatar(fim)} a ${formatar(inicio)}`
  }

  return `${formatar(inicio)} a ${formatar(fim)}`
}
