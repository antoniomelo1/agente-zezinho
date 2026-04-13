import {
  resolverTemaDiaDerivado,
  resolverTemaDiaManha,
  resolverTemaDiaTarde
} from './resolverTemaDoRegistro.js'

function formatarDataLocalISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

export default function normalizarRegistroDiario(doc) {
  const dados = doc.data()

  return {
    id: doc.id,
    ...dados,
    dataISO: formatarDataLocalISO(dados.data.toDate()),
    resumoManha: dados.resumoManha || '',
    resumoTarde: dados.resumoTarde || '',
    temaDia: resolverTemaDiaDerivado(dados) || '',
    temaDiaManha: resolverTemaDiaManha(dados) || '',
    temaDiaTarde: resolverTemaDiaTarde(dados) || '',
    temaAnterior: dados.temaAnterior || '',
    tipoAula: dados.tipoAula || '',
    modulo: dados.modulo || 'N\u00e3o informado',
    softOriente: dados.softOriente || '',
    softCoracao: dados.softCoracao || '',
    fotos: Array.isArray(dados.fotos) ? dados.fotos : []
  }
}
