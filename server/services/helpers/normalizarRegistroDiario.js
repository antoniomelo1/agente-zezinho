export default function normalizarRegistroDiario(doc) {
  const dados = doc.data()

  return {
    id: doc.id,
    ...dados,
    dataISO: dados.data.toDate().toISOString().substring(0, 10),
    resumoManha: dados.resumoManha || '',
    resumoTarde: dados.resumoTarde || '',
    temaDia: dados.temaDia || '',
    temaAnterior: dados.temaAnterior || '',
    tipoAula: dados.tipoAula || '',
    modulo: dados.modulo || 'N\u00e3o informado',
    softOriente: dados.softOriente || '',
    softCoracao: dados.softCoracao || '',
    fotos: Array.isArray(dados.fotos) ? dados.fotos : []
  }
}
