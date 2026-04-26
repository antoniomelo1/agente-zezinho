import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase/firebase'
import { useAuthStore } from '../stores/authStore'
import { ROLES, ROLES_COORDENACAO, isRoleCoordenacao } from '../constants/roles'

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
    meta: { requiresAuth: true, roles: ROLES_COORDENACAO }
  },

  {
    path: '/registro-diario',
    component: RegistrarResumoDiario,
    meta: { requiresAuth: true, role: ROLES.EDUCADOR }
  },

  {
    path: '/relatorio-mensal',
    component: RelatorioMensal,
    meta: { requiresAuth: true, role: ROLES.EDUCADOR }
  },

  {
    path: '/plano-aulas-mensal',
    component: PlanoAulasMensal,
    meta: { requiresAuth: true, role: ROLES.EDUCADOR }
  },

  {
    path: '/base-institucional',
    component: BaseInstitucional,
    meta: { requiresAuth: true, roles: [ROLES.EDUCADOR, ...ROLES_COORDENACAO] }
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

function redirecionarPorRole(role) {
  if (isRoleCoordenacao(role)) {
    return '/painel-coordenador'
  }

  if (role === ROLES.EDUCADOR) {
    return '/registro-diario'
  }

  return '/login'
}

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
      next(redirecionarPorRole(authStore.role))
      return
    }
  }

  // 🔐 Múltiplos papéis permitidos
  if (to.meta.roles) {
    if (!to.meta.roles.includes(authStore.role)) {
      next(redirecionarPorRole(authStore.role))
      return
    }
  }

  next()
})

export default router
