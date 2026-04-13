// services/gerarRelatorioMensal.js
import admin from '../firebaseAdmin.js'

import gerarDefesaProjeto from './gerarDefesaProjeto.js'
import montarSemanaRelatorioMensal from './montarSemanaRelatorioMensal.js'
import {
  buscarRegistrosDiariosPorPeriodo,
  buscarTextoBaseDefesaProjetoPorAno
} from './relatorioMensalDataAccess.js'
import { agruparPorSemanaPedagogica } from './helpers/relatorioMensalHelpers.js'

export async function gerarRelatorioMensal({ mes, ano }) {
  if (!mes || !ano) {
    throw new Error('M\u00eas e ano s\u00e3o obrigat\u00f3rios')
  }

  const mesNumero = Number(mes)
  const anoNumero = Number(ano)

  if (mesNumero < 1 || mesNumero > 12) {
    throw new Error('M\u00eas inv\u00e1lido')
  }

  const mesStr = String(mesNumero).padStart(2, '0')

  const dataInicio = new Date(`${anoNumero}-${mesStr}-01T00:00:00`)
  const dataFim = new Date(anoNumero, mesNumero, 0, 23, 59, 59)

  const timestampInicio = admin.firestore.Timestamp.fromDate(dataInicio)
  const timestampFim = admin.firestore.Timestamp.fromDate(dataFim)

  const registros = await buscarRegistrosDiariosPorPeriodo({
    timestampInicio,
    timestampFim
  })

  const textoBaseDefesa = await buscarTextoBaseDefesaProjetoPorAno({
    ano: anoNumero
  })

  const semanasAgrupadas = agruparPorSemanaPedagogica(registros)

  const semanasProcessadas = []
  const resumosDoMes = []

  for (const semana of semanasAgrupadas) {
    const { semanaProcessada, resumosSemana } =
      await montarSemanaRelatorioMensal(semana)

    resumosSemana.forEach((resumoPedagogico) => {
      resumosDoMes.push(resumoPedagogico)
    })

    semanasProcessadas.push(semanaProcessada)
  }

  const defesaProjetoAplicado = await gerarDefesaProjeto(
    textoBaseDefesa,
    resumosDoMes.join('\n')
  )

  return {
    cabecalho: {
      titulo: 'Relat\u00f3rio de Execu\u00e7\u00e3o Mensal \u2013 Oficina de Programa\u00e7\u00e3o',
      mes: mesNumero,
      ano: anoNumero,
      defesaProjetoAplicado: defesaProjetoAplicado || ''
    },
    semanas: semanasProcessadas
  }
}
