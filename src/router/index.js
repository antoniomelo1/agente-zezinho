import { createRouter, createWebHistory } from 'vue-router'

import RegistrarResumoDiario from '../components/RegistrarResumoDiario.vue'
import RelatorioMensal from '../components/RelatorioMensal.vue'
import ImportarPlanoAnual from '../components/ImportarPlanoAnual.vue'

const routes = [
  {
    path: '/',
    redirect: '/registro-diario'
  },
  {
    path: '/registro-diario',
    component: RegistrarResumoDiario
  },
  {
    path: '/relatorio-mensal',
    component: RelatorioMensal
  },
  {
    path: '/plano-anual',
    component: ImportarPlanoAnual
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
