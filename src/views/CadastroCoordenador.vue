<template>
  <section class="cadastro-desativado">
    <h2>Cadastro direto desativado</h2>

    <p>
      O cadastro direto de coordenadores foi desativado por regra de governanca
      institucional. A criacao e gestao de contas institucionais devem ser realizadas pela
      area oficial de Gestao de Contas, com validacao de acesso e registro no
      backend.
    </p>

    <router-link to="/login" class="link-login">
      Voltar ao login
    </router-link>
  </section>
</template>

<style scoped>
.cadastro-desativado {
  max-width: 560px;
  margin: 80px auto;
  padding: 32px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #f8fafc;
  text-align: center;
}

.cadastro-desativado h2 {
  margin: 0 0 16px;
  font-size: 1.6rem;
}

.cadastro-desativado p {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.6;
}

.link-login {
  display: inline-flex;
  margin-top: 24px;
  color: #67e8f9;
  font-weight: 700;
  text-decoration: none;
}

.link-login:hover {
  text-decoration: underline;
}
</style>
