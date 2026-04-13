# 📘 Leitura Operacional do Coordenador – Evolução v2

## 🧩 Sistema
**Agente Pedagógico – Casa do Zezinho**  
Módulo: Painel do Coordenador  
Funcionalidade: Leitura Operacional  

---

## 🎯 Objetivo da evolução

Expandir a funcionalidade de leitura operacional para permitir **consulta contextual de registros recentes**, mantendo:

- simplicidade da interface  
- foco em acompanhamento pedagógico  
- baixo acoplamento com outras funcionalidades  

Sem transformar a tela em um módulo de relatório completo.

---

## 🧠 Princípio de design

A leitura operacional segue o conceito de:

> Visão rápida por padrão, aprofundamento sob demanda

Ou seja:

- estado padrão → visão resumida  
- estado filtrado → visão contextual controlada  

---

## ⚙️ Comportamento da funcionalidade

### 1. Estado padrão (sem filtros específicos)

**Condições:**
- todas as oficinas ou múltiplos educadores selecionados  

**Comportamento:**
- exibição do **último registro por educador**
- dados consolidados por oficina
- sem histórico expandido  

**Objetivo:**
- leitura rápida da situação atual  

---

### 2. Modo detalhado (oficina + educador)

**Condições:**
- `oficinaId` definido  
- `educadorId` definido  

**Comportamento:**
- exibição dos **3 registros mais recentes**
- ordenação por data decrescente  
- exibição em bloco separado: **Histórico recente do educador**  

**Objetivo:**
- fornecer contexto pedagógico recente sem poluir a tela  

---

### 3. Filtro por data específica

**Condições:**
- `oficinaId` definido  
- `educadorId` definido  
- `data` informada  

**Comportamento:**
- exibição de **1 único registro correspondente à data**
- substitui o modo “últimos 3 registros”
- mensagem contextual indicando busca por data  

**Objetivo:**
- permitir consulta pontual sem sair da leitura operacional  

---

### 4. Estado sem resultado

**Condições:**
- não há registro para o filtro aplicado  

**Comportamento:**
- exibição de mensagem clara  
- manutenção da estrutura da interface  
- filtros permanecem visíveis  

---

## 🔌 Backend

### Endpoint reutilizado

```http
GET /coordenador/leitura-operacional