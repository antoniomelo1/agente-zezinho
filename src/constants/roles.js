export const ROLES = {
  COORDENADOR: 'coordenador',
  COORDENADOR_MASTER: 'coordenador_master',
  COORDENADOR_PEDAGOGICO: 'coordenador_pedagogico',
  GESTOR_PEDAGOGICO: 'gestor_pedagogico',
  EDUCADOR: 'educador'
}

export const ROLES_COORDENACAO = [
  ROLES.COORDENADOR,
  ROLES.COORDENADOR_MASTER
]

export const ROLES_COORDENACAO_PEDAGOGICA = [
  ROLES.COORDENADOR_PEDAGOGICO,
  ROLES.GESTOR_PEDAGOGICO
]

export function isRoleCoordenacao(role) {
  return ROLES_COORDENACAO.includes(role)
}

export function isRoleCoordenadorMaster(role) {
  return role === ROLES.COORDENADOR_MASTER
}

export function isRoleEducador(role) {
  return role === ROLES.EDUCADOR
}

export function isRoleCoordenadorPedagogico(role) {
  return role === ROLES.COORDENADOR_PEDAGOGICO
}

export function isRoleGestorPedagogico(role) {
  return role === ROLES.GESTOR_PEDAGOGICO
}

export function isRoleCoordenacaoPedagogica(role) {
  return ROLES_COORDENACAO_PEDAGOGICA.includes(role)
}
