📄 POLITICA_DE_REVISAO.md
Política de Revisão de Código

Agente Pedagógico / Agente Zezinho – Core System v2.0

1. Princípio fundamental

Cada Pull Request (PR) deve possuir um único objetivo claro.

Não é permitido misturar no mesmo PR:

correção textual
mudança funcional
refatoração
nova funcionalidade

PRs que misturem escopos devem ser rejeitados e reabertos de forma segmentada.

2. Classificação obrigatória do PR

Todo PR deve indicar explicitamente seu tipo:

fix(ui) → ajustes de interface e textos visíveis
fix(backend) → ajustes internos sem alteração de comportamento
refactor → reorganização de código sem mudança funcional
feat → nova funcionalidade
3. Regras para PRs textuais

Um PR só pode ser considerado textual se:

alterar apenas textos visíveis ao usuário
não alterar lógica, fluxo ou comportamento

Não pode envolver:

leitura/escrita no Firestore
rotas ou navegação
payloads ou estrutura de dados
prompts de IA
geração de relatório
geração de DOCX
autenticação ou autorização

Se qualquer um desses pontos for afetado, o PR deixa de ser textual.

4. Texto como elemento funcional

No sistema, texto pode ter impacto funcional indireto.

Devem ser tratados como código sensível:

prompts de IA
textos de relatório mensal
textos de plano de aulas
conteúdos exportados em DOCX
mensagens utilizadas em error.message

Nestes casos, alterações exigem revisão funcional completa.

5. Regra crítica de tratamento de erro

Não utilizar error.message para controle de fluxo.

Sempre utilizar estrutura padronizada:

code → identificador técnico estável
message → texto exibido ao usuário

A lógica do sistema deve depender apenas de code.

6. Checklist obrigatório de revisão

Antes de aprovar qualquer PR, validar conforme o contexto:

Autenticação
houve alteração de regra de acesso?
houve alteração de status HTTP?
houve alteração de redirecionamento?
Firestore
houve alteração de query?
houve alteração de coleção?
houve alteração de persistência?
houve alteração na estrutura dos dados?
Relatório e IA
houve alteração de prompt?
houve alteração de contexto enviado?
houve alteração de formato esperado?
DOCX
houve alteração na estrutura do documento?
houve alteração na ordem dos blocos?
houve alteração nos campos utilizados?
7. Teste manual mínimo obrigatório

Todo PR deve passar pelos seguintes testes:

login
primeiro acesso
cadastro institucional
registro diário
geração de relatório mensal
exportação DOCX

Se algum fluxo falhar, o PR não deve ser aprovado.

8. Organização dos PRs

Os PRs devem ser organizados por domínio funcional:

autenticação e acesso
registro diário
relatório mensal
geração DOCX
plano mensal e base institucional
interface
9. Regra de bloqueio automático

O PR deve ser rejeitado se, junto com correção textual, houver:

alteração em Firestore
alteração de rotas
alteração de navegação
alteração de prompts
alteração de DOCX
alteração de autenticação
alteração no tratamento de erro
10. Padrão de commits

Utilizar mensagens claras e padronizadas:

fix(ui): corrige labels em ListarRegistros
fix(auth): ajusta mensagens de acesso
feat(plano-mensal): adiciona geração do plano mensal
refactor(relatorio): reorganiza montagem do relatório
🎯 Objetivo da política
reduzir risco de regressão
evitar mistura de escopos
tornar revisões mais rápidas e confiáveis
proteger fluxos institucionais críticos
garantir consistência entre IA, relatório e DOCX
