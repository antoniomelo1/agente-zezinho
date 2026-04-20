import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase/firebase'
import { useAuthStore } from '../stores/authStore'

import RegistrarResumoDiario from '../components/RegistrarResumoDiario.vue'
import RelatorioMensal from '../components/RelatorioMensal.vue'
import PlanoAulasMensal from '../components/PlanoAulasMensal.vue'
import BaseInstitucional from '../components/BaseInstitucional.vue'

import Login from '../views/Login.vue'
import PainelCoordenador from '../views/PainelCoordenador.vue'
import PrimeiroAcesso from '../views/PrimeiroAcesso.vue'

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', component: Login },
  { path: '/primeiro-acesso', component: PrimeiroAcesso },
  { path: '/cadastro-coordenador', redirect: '/login' },

  {
    path: '/painel-coordenador',
    component: PainelCoordenador,
    meta: { requiresAuth: true, role: 'coordenador' }
  },

  {
    path: '/registro-diario',
    component: RegistrarResumoDiario,
    meta: { requiresAuth: true, role: 'educador' }
  },

  {
    path: '/relatorio-mensal',
    component: RelatorioMensal,
    meta: { requiresAuth: true, role: 'educador' }
  },

  {
    path: '/plano-aulas-mensal',
    component: PlanoAulasMensal,
    meta: { requiresAuth: true, role: 'educador' }
  },

  {
    path: '/base-institucional',
    component: BaseInstitucional,
    meta: { requiresAuth: true, roles: ['educador', 'coordenador'] }
  },

  {
    path: '/plano-anual',
    redirect: '/base-institucional'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const usuario = auth.currentUser

  // 🔐 Não está logado
  if (to.meta.requiresAuth && !usuario) {
    next('/login')
    return
  }

  // 🔐 Role único
  if (to.meta.role) {
    if (authStore.role !== to.meta.role) {
      if (authStore.role === 'coordenador') {
        next('/painel-coordenador')
      } else if (authStore.role === 'educador') {
        next('/registro-diario')
      } else {
        next('/login')
      }
      return
    }
  }

  // 🔐 Múltiplos papéis permitidos
  if (to.meta.roles) {
    if (!to.meta.roles.includes(authStore.role)) {
      if (authStore.role === 'coordenador') {
        next('/painel-coordenador')
      } else if (authStore.role === 'educador') {
        next('/registro-diario')
      } else {
        next('/login')
      }
      return
    }
  }

  next()
})

export default router
