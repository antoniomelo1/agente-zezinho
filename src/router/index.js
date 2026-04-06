import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase/firebase'
import { useAuthStore } from '../stores/authStore'

import RegistrarResumoDiario from '../components/RegistrarResumoDiario.vue'
import RelatorioMensal from '../components/RelatorioMensal.vue'
import ImportarPlanoAnual from '../components/ImportarPlanoAnual.vue'

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
    path: '/plano-anual',
    component: ImportarPlanoAnual,
    meta: { requiresAuth: true, roles: ['educador', 'coordenador'] }
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
