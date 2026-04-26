export const ROLES = {
  COORDENADOR: 'coordenador',
  COORDENADOR_MASTER: 'coordenador_master',
  EDUCADOR: 'educador'
}

export const ROLES_COORDENACAO = [
  ROLES.COORDENADOR,
  ROLES.COORDENADOR_MASTER
]

export function isRoleCoordenacao(role) {
  return ROLES_COORDENACAO.includes(role)
}

export function isRoleEducador(role) {
  return role === ROLES.EDUCADOR
}
