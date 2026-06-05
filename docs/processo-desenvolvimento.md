# Processo de Desenvolvimento - Agente Zezinho Core System v2.0

# Fluxo Resumido

1. Mapeamento
2. Validação Humana
3. Implementação
4. Revisão da IA
5. Checklist de Regressão
6. Testes Manuais
7. Pull Request
8. Merge
9. Limpeza das Branches

Nenhuma etapa deve ser ignorada.

## Objetivo

Este documento define o processo oficial de evolução do sistema Agente Zezinho - Core System v2.0.

O objetivo é garantir segurança, previsibilidade, governança institucional, rastreabilidade das alterações e redução de regressões durante a evolução do sistema.

Toda implementação deverá seguir obrigatoriamente as etapas descritas neste documento.

---

# Fluxo Oficial de Desenvolvimento

## 1. Mapeamento

### Objetivo

Compreender completamente a alteração antes de escrever código.

### Atividades

* Identificar o problema ou necessidade.
* Mapear arquivos candidatos à alteração.
* Identificar dependências.
* Identificar impactos potenciais.
* Identificar riscos técnicos e institucionais.
* Definir claramente o que está dentro e fora do escopo.

### Entregável

Documento de mapeamento contendo:

* Objetivo.
* Escopo.
* Arquivos candidatos.
* Riscos.
* Dependências.
* Itens fora do escopo.

### Regra

Nenhum código deve ser alterado nesta etapa.

---

## 2. Validação Humana

### Objetivo

Garantir que a solução proposta atende às necessidades institucionais e pedagógicas.

### Atividades

* Revisão do mapeamento.
* Avaliação dos riscos.
* Ajustes de escopo.
* Aprovação ou reprovação da proposta.

### Regra

A implementação somente poderá iniciar após aprovação explícita.

---

## 3. Implementação

### Objetivo

Executar apenas o escopo aprovado.

### Regras

* Não realizar refatorações paralelas.
* Não adicionar funcionalidades não aprovadas.
* Não alterar arquivos fora do escopo sem justificativa.
* Não expandir a implementação durante a execução.

### Entregável

Código implementado conforme aprovação da etapa anterior.

---

## 4. Revisão da IA

### Objetivo

Realizar auditoria técnica da implementação.

### Verificações

* Alterações fora do escopo.
* Possíveis regressões.
* Riscos de segurança.
* Problemas de governança.
* Duplicação de lógica.
* Dependências não previstas.

### Regra

Nenhum PR deve ser aberto antes da revisão da IA.

---

## 5. Checklist de Regressão

### Objetivo

Verificar sistematicamente impactos da implementação em funcionalidades existentes.

### Documento Obrigatório

docs/checklist-regressao-pr.md

### Verificações

#### Escopo

* Alteração limitada ao objetivo aprovado.
* Ausência de alterações indevidas.
* Ausência de refatoração desnecessária.

#### Regras Institucionais

* Linguagem institucional preservada.
* Uso correto dos termos institucionais.
* Regras da Oficina de Programação preservadas.

#### Permissões

* Educador permanece restrito ao seu escopo.
* Coordenador mantém permissões corretas.
* Gestor mantém permissões globais.
* Nenhuma regra de autenticação foi enfraquecida.

#### Governança

* Escopo institucional continua respeitado.
* Coordenador continua limitado às oficinas permitidas.
* Gestor continua com visão global.
* Educador continua sem acesso administrativo.

#### Dados e Firestore

* Sem risco de perda de dados.
* Sem escrita indevida pelo frontend.
* Compatibilidade com registros antigos.
* Compatibilidade com coleções existentes.

#### Auditoria

* Histórico institucional preservado.
* Auditorias continuam acessíveis.
* Invalidações continuam rastreáveis.
* Dados históricos permanecem preservados.

#### Funcionalidades Relacionadas

* Registro Diário.
* Plano Mensal.
* Relatório Mensal.
* Ocorrências de Calendário.
* Exportação DOCX.

#### Interface

* Funcionamento em desktop.
* Funcionamento em celular.
* Estados de carregamento corretos.
* Ausência de exposição de dados sensíveis.

### Regra

O checklist deve ser revisado antes dos testes manuais.

---

## 6. Testes Manuais

### Objetivo

Validar o comportamento real da funcionalidade.

### Exemplos

* Fluxo feliz.
* Campos inválidos.
* Permissões.
* Responsividade.
* Usuário Educador.
* Usuário Coordenador.
* Usuário Gestor.
* Dados antigos.
* Falha de rede.
* Falha de API.

### Regra

Os testes devem ser documentados.

---

## 7. Pull Request

### Objetivo

Registrar formalmente a alteração.

### Pré-requisitos

* Mapeamento concluído.
* Validação humana realizada.
* Implementação concluída.
* Revisão da IA realizada.
* Checklist de regressão validado.
* Testes manuais executados.

### Regra

Nenhum PR deve ser criado sem cumprir as etapas anteriores.

---

## 8. Merge

### Objetivo

Integrar a alteração à branch principal.

### Pré-requisitos

* PR aprovado.
* Testes concluídos.
* Sem pendências críticas.

### Regra

O merge somente poderá ocorrer após aprovação formal.

---

## 9. Limpeza das Branches

### Objetivo

Manter o repositório organizado.

### Procedimento

Após merge:

```bash
git checkout main
git pull origin main

git branch -d nome-da-branch
git push origin --delete nome-da-branch
```

### Regra

Branches finalizadas não devem permanecer ativas localmente ou remotamente.

---

# Princípios do Projeto

## Governança

O backend é a autoridade de segurança.

O frontend nunca deve ser responsável pela proteção de dados institucionais.

---

## Escopo

Cada fase deve possuir objetivo único e claramente definido.

---

## Segurança

Toda alteração deve priorizar:

* Integridade dos dados.
* Rastreabilidade.
* Compatibilidade com registros antigos.
* Governança institucional.

---

## Auditoria

Toda ação corretiva deve preservar histórico institucional.

Nenhum dado institucional deve ser removido sem rastreabilidade.

---

## Evolução Controlada

O sistema deve evoluir por fases pequenas, aprovadas e verificáveis.

Mudanças amplas devem ser divididas em etapas menores.

# Critérios de Pronto

Uma fase somente é considerada concluída quando:

- Mapeamento aprovado
- Implementação concluída
- Revisão da IA concluída
- Checklist de regressão validado
- Testes manuais executados
- PR aprovado
- Merge realizado
- Branch local removida
- Branch remota removida
