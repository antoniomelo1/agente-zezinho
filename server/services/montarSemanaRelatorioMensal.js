import gerarParecerSemanal from './gerarParecerSemanal.js'
import montarDiaRelatorioMensal from './montarDiaRelatorioMensal.js'
import {
  montarPeriodoOrdenado,
  montarResumoPedagogico
} from './helpers/relatorioMensalHelpers.js'

export default async function montarSemanaRelatorioMensal(semana) {
  const diasProcessados = []
  const resumosSemana = []
  const fotosSemana = []

  for (const dia of semana.dias) {
    const resumoPedagogico = montarResumoPedagogico(dia)

    diasProcessados.push(await montarDiaRelatorioMensal(dia))

    fotosSemana.push(...dia.fotos)
    resumosSemana.push(resumoPedagogico)
  }

  const parecerTecnico =
    resumosSemana.length > 0
      ? await gerarParecerSemanal(resumosSemana.join('\n'))
      : ''

  return {
    semanaProcessada: {
      identificador: semana.label,
      periodo: montarPeriodoOrdenado(semana.inicio, semana.fim),
      dias: diasProcessados,
      parecerTecnico: parecerTecnico || '',
      fotos: fotosSemana.slice(0, 3)
    },
    resumosSemana
  }
}
