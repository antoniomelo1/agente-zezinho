<script setup>
import logo from './assets/logo.png'
</script>

<template>
  <div class="app-container">
    <header class="navbar">
      <div class="logo-area">
        <div class="logo-glow-container">
          <img :src="logo" alt="Agente Zezinho" class="logo" />
        </div>
        <div class="logo-texto">
          <h1>Agente Zezinho</h1>
          <span class="sub-logo">Core System v2.0</span>
        </div>
      </div>

      <nav class="menu">
        <router-link to="/registro-diario">Registro</router-link>
        <router-link to="/relatorio-mensal">Relatórios</router-link>
        <router-link to="/plano-anual">Plano Anual</router-link>
      </nav>
    </header>

    <main class="conteudo">
      <div class="glass-card">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  /* Fundo inspirado no azul profundo do seu logo */
  background: radial-gradient(circle at top right, #1e1b4b, #0f172a, #020617);
  background-attachment: fixed;
}

/* NAVBAR */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 3rem;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-glow-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Efeito de brilho atrás do logo */
.logo-glow-container::after {
  content: '';
  position: absolute;
  width: 50px;
  height: 50px;
  background: #00f2fe;
  filter: blur(25px);
  opacity: 0.4;
  z-index: -1;
}

.logo {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  border: 2px solid rgba(0, 242, 254, 0.5);
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: rotate(15deg) scale(1.1);
}

.logo-texto h1 {
  font-size: 1.1rem;
  color: #fff;
  margin: 0;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.sub-logo {
  font-size: 0.65rem;
  color: #00f2fe;
  letter-spacing: 3px;
  font-weight: bold;
}

/* MENU */
.menu {
  display: flex;
  gap: 1.5rem;
}

.menu a {
  color: #94a3b8;
  text-decoration: none;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 50px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.menu a:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.menu a.router-link-active {
  background: linear-gradient(90deg, #00f2fe, #7c3aed);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* CONTEÚDO */
.conteudo {
  flex: 1;
  padding: 2.5rem;
  display: flex;
  justify-content: center;
}

.glass-card {
  width: 100%;
  max-width: 1200px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  /* Reduz o espaçamento da barra principal */
  .navbar {
    flex-direction: column;
    padding: 1.5rem 1rem;
    gap: 1.2rem;
    text-align: center;
  }

  /* Ajusta o logo para não ocupar muito espaço vertical */
  .logo-area {
    flex-direction: column;
    gap: 8px;
  }

  .logo {
    width: 55px;
    height: 55px;
    border-radius: 50%; /* Garante que fique redondo */
    object-fit: cover;
    background: white; /* Fundo branco interno caso o logo tenha transparência */
    border: 2px solid var(--cor-primaria);
    box-shadow: 0 0 15px rgba(0, 242, 254, 0.5);
  }

  /* Faz o menu ocupar a largura toda e distribuir os links */
  .menu {
    width: 100%;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap; /* Permite que os botões quebrem linha se necessário */
  }

  .menu a {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem; /* Diminui um pouco a fonte no celular */
    flex: 1 1 auto;   /* Faz os botões crescerem proporcionalmente */
    text-align: center;
  }

  /* Ajusta o container do conteúdo para não "vazar" */
  .conteudo {
    padding: 1rem; /* Reduz a margem externa no mobile */
  }

  .glass-card {
    padding: 1.5rem 1rem; /* Reduz o espaçamento interno do card */
    border-radius: 16px;
  }
}
</style>