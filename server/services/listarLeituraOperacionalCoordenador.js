import { adminDb } from '../firebaseAdmin.js'
import { ROLES } from '../constants/roles.js'
import classificarStatusAtualizacao from './helpers/classificarStatusAtualizacao.js'
import { resolverTemaDiaDerivado } from './helpers/resolverTemaDoRegistro.js'

function formatarDataLocalISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function normalizarDataISO(timestamp) {
  if (!timestamp?.toDate) {
    return null
  }

  return formatarDataLocalISO(timestamp.toDate())
}

function montarLeituraEducador(educador, registroSnap) {
  if (!registroSnap?.exists) {
    return {
      uidEducador: educador.uid,
      nomeEducador: educador.nome,
      oficinaId: educador.oficinaId || '',
      dataUltimoRegistro: null,
      temaDia: '',
      modulo: '',
      tipoAula: '',
      totalPresentesManha: null,
      totalPresentesTarde: null,
      totalPresentes: null,
      statusAtualizacao: 'sem_registro',
      temRegistro: false
    }
  }

  const dadosRegistro = registroSnap.data()
  const dataUltimoRegistro = normalizarDataISO(dadosRegistro.data)

  return {
    uidEducador: educador.uid,
    nomeEducador: dadosRegistro.nomeEducador || educador.nome,
    oficinaId: dadosRegistro.oficinaId || educador.oficinaId || '',
    dataUltimoRegistro,
    temaDia: resolverTemaDiaDerivado(dadosRegistro),
    modulo: dadosRegistro.modulo || '',
    tipoAula: dadosRegistro.tipoAula || '',
    totalPresentesManha: dadosRegistro.totalPresentesManha ?? null,
    totalPresentesTarde: dadosRegistro.totalPresentesTarde ?? null,
    totalPresentes: dadosRegistro.totalPresentes ?? null,
    statusAtualizacao: classificarStatusAtualizacao(
      dataUltimoRegistro,
      dadosRegistro.oficinaId || educador.oficinaId || ''
    ),
    temRegistro: true
  }
}

function consolidarOficinas(leituraEducadores) {
  const oficinasMap = new Map()

  for (const educador of leituraEducadores) {
    const oficinaId = educador.oficinaId || 'sem_oficina'

    if (!oficinasMap.has(oficinaId)) {
      oficinasMap.set(oficinaId, {
        oficinaId,
        dataUltimoRegistro: null,
        statusAtualizacao: 'sem_registro',
        totalEducadores: 0,
        educadoresComRegistro: 0,
        educadoresSemRegistro: 0
      })
    }

    const oficina = oficinasMap.get(oficinaId)
    oficina.totalEducadores += 1

    if (educador.temRegistro) {
      oficina.educadoresComRegistro += 1

      if (
        !oficina.dataUltimoRegistro ||
        educador.dataUltimoRegistro > oficina.dataUltimoRegistro
      ) {
        oficina.dataUltimoRegistro = educador.dataUltimoRegistro
      }
    } else {
      oficina.educadoresSemRegistro += 1
    }

  }

  return Array.from(oficinasMap.values())
    .map((oficina) => ({
      ...oficina,
      statusAtualizacao: classificarStatusAtualizacao(
        oficina.dataUltimoRegistro,
        oficina.oficinaId
      )
    }))
    .sort((a, b) => a.oficinaId.localeCompare(b.oficinaId, 'pt-BR'))
}

export default async function listarLeituraOperacionalCoordenador() {
  const educadoresSnapshot = await adminDb
    .collection('usuarios')
    .where('role', '==', ROLES.EDUCADOR)
    .where('ativo', '==', true)
    .get()

  const educadores = educadoresSnapshot.docs
    .map((doc) => {
      const data = doc.data()

      return {
        uid: data.uid || doc.id,
        nome: data.nome || '',
        oficinaId: data.oficinaId || ''
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const registrosRecentes = await Promise.all(
    educadores.map((educador) =>
      adminDb
        .collection('registros_diarios')
        .where('uidEducador', '==', educador.uid)
        .where('excluido', '==', false)
        .orderBy('data', 'desc')
        .limit(1)
        .get()
    )
  )

  const leituraEducadores = educadores.map((educador, index) =>
    montarLeituraEducador(educador, registrosRecentes[index].docs[0] || null)
  )

  return {
    geradoEm: new Date().toISOString(),
    oficinas: consolidarOficinas(leituraEducadores),
    educadores: leituraEducadores
  }
}
