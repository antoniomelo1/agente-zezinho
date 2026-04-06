import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref(null)
  const uid = ref(null)
  const role = ref(null)
  const status = ref(null)
  const ativo = ref(false)
  const oficinasResponsaveis = ref([])
  const carregando = ref(true)

  function setUsuario(dados) {
    usuario.value = dados
    uid.value = dados?.uid || null
    role.value = dados?.role || null
    status.value = dados?.status || null
    ativo.value = dados?.ativo ?? dados?.status === 'ativo'
    oficinasResponsaveis.value = dados?.oficinasResponsaveis || []
  }

  function limparUsuario() {
    usuario.value = null
    uid.value = null
    role.value = null
    status.value = null
    ativo.value = false
    oficinasResponsaveis.value = []
  }

  return {
    usuario,
    uid,
    role,
    status,
    ativo,
    oficinasResponsaveis,
    carregando,
    setUsuario,
    limparUsuario
  }
})
