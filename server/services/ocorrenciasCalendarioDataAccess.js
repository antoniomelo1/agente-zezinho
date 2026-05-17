import { adminDb } from '../firebaseAdmin.js'
import {
  OFICINA_PROGRAMACAO_ID,
  listarDatasOficiaisDoMes
} from './helpers/diasOficiaisOficinas.js'

function normalizarTexto(valor) {
  if (valor === null || valor === undefined) {
    return ''
  }

  return String(valor).trim()
}

function normalizarOcorrenciaCalendario(doc, datasOficiaisSet) {
  const data = doc.data()
  const datas = Array.isArray(data.datasAfetadas)
    ? data.datasAfetadas
      .map(normalizarTexto)
      .filter((dataISO) => datasOficiaisSet.has(dataISO))
      .sort()
    : []

  return {
    id: doc.id,
    oficinaId: data.oficinaId || null,
    datas,
    motivoTipo: data.motivoTipo || '',
    descricao: data.descricao || '',
    escopo: data.escopo || ''
  }
}

export async function buscarOcorrenciasCalendarioAtivasPorMes({
  ano,
  mes,
  oficinaId = OFICINA_PROGRAMACAO_ID
}) {
  const datasOficiais = listarDatasOficiaisDoMes({ ano, mes, oficinaId })
  return buscarOcorrenciasCalendarioAtivasPorDatas({
    datasOficiais,
    oficinaId
  })
}

export async function buscarOcorrenciasCalendarioAtivasPorDatas({
  datasOficiais,
  oficinaId = OFICINA_PROGRAMACAO_ID
}) {
  const datasOficiaisSet = new Set(datasOficiais)
  const ocorrenciasPorId = new Map()

  for (const dataISO of datasOficiais) {
    const snapshot = await adminDb
      .collection('ocorrencias_calendario')
      .where('datasAfetadas', 'array-contains', dataISO)
      .get()

    snapshot.docs.forEach((doc) => {
      if (ocorrenciasPorId.has(doc.id)) {
        return
      }

      const data = doc.data()
      const escopo = data.escopo || ''

      if (data.status !== 'ativo') {
        return
      }

      if (escopo !== 'institucional' && escopo !== 'oficina') {
        return
      }

      if (escopo === 'oficina' && data.oficinaId !== oficinaId) {
        return
      }

      const ocorrencia = normalizarOcorrenciaCalendario(doc, datasOficiaisSet)

      if (ocorrencia.datas.length > 0) {
        ocorrenciasPorId.set(doc.id, ocorrencia)
      }
    })
  }

  return Array.from(ocorrenciasPorId.values()).sort((a, b) => {
    const primeiraDataA = a.datas[0] || ''
    const primeiraDataB = b.datas[0] || ''

    if (primeiraDataA !== primeiraDataB) {
      return primeiraDataA.localeCompare(primeiraDataB)
    }

    return a.descricao.localeCompare(b.descricao, 'pt-BR')
  })
}
