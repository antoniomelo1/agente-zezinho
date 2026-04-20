<script setup>
import { ref } from 'vue'

import DocumentoBasePlanoMensal from './DocumentoBasePlanoMensal.vue'
import ImportarPlanoAnual from './ImportarPlanoAnual.vue'

const abaAtiva = ref('plano-anual')
</script>

<template>
  <main class="base-institucional-container">
    <section class="abas">
      <button
        class="aba-botao"
        :class="{ ativo: abaAtiva === 'plano-anual' }"
        @click="abaAtiva = 'plano-anual'"
      >
        Plano Anual
      </button>

      <button
        class="aba-botao"
        :class="{ ativo: abaAtiva === 'documento-base' }"
        @click="abaAtiva = 'documento-base'"
      >
        Documento Base do Plano Mensal
      </button>
    </section>

    <section v-if="abaAtiva === 'plano-anual'" class="conteudo-aba">
      <ImportarPlanoAnual />
    </section>

    <section v-else class="conteudo-aba">
      <DocumentoBasePlanoMensal />
    </section>
  </main>
</template>

<style scoped>
.base-institucional-container {
  margin: 0 auto;
  padding: 32px 20px;
  color: #0f172a;
}

.abas {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.aba-botao {
  height: 42px;
  padding: 0 18px;
  border: 1px solid #334155;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.aba-botao.ativo {
  background: linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%);
  border-color: transparent;
}

.conteudo-aba {
  margin-top: 4px;
}
</style>
