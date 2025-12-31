<script setup>
import RegistrarAula from './components/RegistrarAula.vue'
</script>

<template>
  <div class="app-container">
    <RegistrarAula />
  </div>
    <footer class="app-footer">
    <p>
      © 2025 Antonio Melo · Projeto educacional com IA ·
      <a href="mailto:antoniorodriguesmelo200@gmail.com">Contato</a>
    </p>
  </footer>
</template>

<style>
.app-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* Removendo o estilo antigo que limitava muito a largura */
.app {
  max-width: none; 
  margin: 0;
}
</style>


