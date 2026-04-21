import gerarSoftSkills from './gerarSoftSkills.js'
import gerarTabelaDiaria from './gerarTabelaDiaria.js'
import { formatarDataBR } from './helpers/relatorioMensalHelpers.js'

export default async function montarDiaRelatorioMensal(dia) {
  const tabela = await gerarTabelaDiaria({
    resumoManha: dia.resumoManha,
    resumoTarde: dia.resumoTarde,
    temaDiaManha: dia.temaDiaManha,
    temaDiaTarde: dia.temaDiaTarde,
    temaDia: dia.temaDia,
    temaAnterior: dia.temaAnterior,
    tipoAula: dia.tipoAula
  })

  return {
    dataISO: dia.dataISO,
    dataFormatada: formatarDataBR(dia.dataISO),
    modulo: dia.modulo,
    temaDiaManha: dia.temaDiaManha || 'Não informado',
    temaDiaTarde: dia.temaDiaTarde || 'Não informado',
    temaDia: dia.temaDia || 'Não informado',
    temaAnterior: dia.temaAnterior || 'Não informado',
    softSkillsDesenvolvidas: await gerarSoftSkills({
      softOriente: dia.softOriente,
      softCoracao: dia.softCoracao
    }),
    tabelaDiaria: tabela,
    fotos: dia.fotos
  }
}
