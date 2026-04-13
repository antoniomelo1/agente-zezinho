# Agente Pedagógico - Instruções do Projeto

## 1. Identidade do sistema

O Agente Pedagógico é um sistema institucional da Casa do Zezinho voltado ao registro pedagógico, organização de dados educacionais e geração de documentos formais relacionados às oficinas da instituição.

A Oficina de Programação representa a primeira implementação prática do sistema, mas a arquitetura deve ser pensada para suportar múltiplas oficinas no futuro, cada uma com suas particularidades pedagógicas, operacionais, visuais e analíticas.

O sistema não deve ser tratado como um sistema exclusivo da Oficina de Programação, mas como uma plataforma institucional multi-oficinas, cuja primeira modelagem foi realizada a partir dessa oficina.

---

## 2. Objetivos principais do sistema

O sistema deve permitir:

- registrar atividades diárias das oficinas
- organizar informações pedagógicas e operacionais
- gerar relatórios institucionais formais
- gerar planos de aula e documentos orientadores
- apoiar o trabalho de educadores e coordenadores
- permitir rastreabilidade institucional dos registros
- preparar os dados para leitura analítica e futura inteligência de apoio à coordenação
- exportar documentos em DOCX com alta compatibilidade com Google Docs

---

## 3. Princípios centrais do projeto

### 3.1. Base institucional comum
O sistema deve possuir um núcleo institucional comum, aplicável a diferentes oficinas, incluindo sempre que fizer sentido:

- identificação da oficina
- identificação do educador responsável
- identificação do coordenador responsável
- data do registro
- turma, grupo ou período
- status do registro
- observações institucionais
- intercorrências
- encaminhamentos
- permissões de acesso
- histórico e rastreabilidade

### 3.2. Camada específica por oficina
Cada oficina pode exigir sua própria estrutura de funcionamento, incluindo:

- telas específicas
- componentes específicos
- campos próprios de formulário
- indicadores pedagógicos específicos
- categorias analíticas próprias
- regras de negócio próprias
- relatórios com blocos e organização próprios

A modelagem da Oficina de Programação não deve ser tratada como padrão rígido obrigatório para todas as demais oficinas.

### 3.3. Dados para dois usos
Os dados do sistema devem ser organizados para atender simultaneamente a dois objetivos:

1. geração de documentos institucionais em linguagem narrativa e formal
2. geração de dados estruturados para análises pedagógicas e operacionais

Sempre que um dado puder ser importante para análise futura, ele não deve existir apenas em texto livre quando puder ser registrado também em campo estruturado, categoria, marcador, lista ou indicador.

---

## 4. Estado atual conhecido do projeto

### 4.1. Estrutura da raiz
Arquivos principais já identificados na raiz:

- `.env`
- `.gitignore`
- `index.html`
- `package.json`
- `package-lock.json`
- `README.md`
- `vite.config.js`

### 4.2. Frontend em `src`
Estrutura principal conhecida:

- `src/assets`
- `src/components`
- `src/firebase`
- `src/router`
- `src/stores`
- `src/views`
- `src/App.vue`
- `src/main.js`
- `src/style.css`

### 4.3. Componentes do frontend já identificados
Componentes operacionais existentes:

- `ImportarPlanoAnual.vue`
- `ListarRegistros.vue`
- `RegistrarAula.vue`
- `RegistrarResumoDiario.vue`
- `RelatorioMensal.vue`
- `RelatorioMensal_Legado.vue`

### 4.4. Views já identificadas
Telas institucionais existentes:

- `CadastroCoordenador.vue`
- `Login.vue`
- `PainelCoordenador.vue`

### 4.5. Camadas auxiliares do frontend
- `src/router/index.js`
- `src/stores/authStore.js`
- `src/firebase/firebase.js`

### 4.6. Backend em `server`
Estrutura principal conhecida:

- `server/constants`
- `server/middlewares`
- `server/services`
- `server/firebase.js`
- `server/firebaseAdmin.js`
- `server/index.js`
- `server/package.json`

### 4.7. Serviços do backend já identificados
Serviços principais existentes:

- `gerarDefesaProjeto.js`
- `gerarParecerSemanal.js`
- `gerarRelatorioDocx.js`
- `gerarRelatorioMensal.js`
- `gerarSoftSkills.js`
- `gerarTabelaDiaria.js`

---

## 5. Stack tecnológica

### Frontend
- Vue 3
- Vite
- Vue Router
- Store para autenticação e estado global

### Backend
- Node.js
- Express
- Firebase Firestore
- Firebase Admin

### Geração textual e documental
- OpenAI API
- biblioteca `docx`

### Banco e autenticação
- Firebase Firestore
- autenticação institucional em evolução com separação de papéis

---

## 6. Regras institucionais de linguagem

### 6.1. Regra geral
A linguagem institucional do sistema deve ser:

- formal
- objetiva
- clara
- coerente com a natureza do documento
- compatível com o contexto pedagógico e institucional da Casa do Zezinho

### 6.2. Terminologia obrigatória
Em documentos institucionais, evitar a palavra:

- `alunos`

Preferir, conforme o contexto:

- `zezinhos`
- `jovens`
- `participantes`
- `integrantes da turma`
- `grupo`

### 6.3. Tempo verbal por tipo de documento
O tempo verbal deve respeitar a finalidade do documento.

#### Relatórios de execução, pareceres e registros avaliativos
Devem ser redigidos preferencialmente no passado, pois descrevem fatos, atividades realizadas, observações e resultados já ocorridos.

#### Planos de aula, planejamentos e documentos orientadores
Podem ser redigidos no presente e no futuro, conforme a natureza pedagógica do conteúdo, já que tratam de previsão, organização e intencionalidade educativa.

### 6.4. Regras de redação institucional
- evitar repetições de abertura de frases
- evitar estrutura excessivamente mecânica
- evitar tom promocional, publicitário ou informal
- evitar orientações genéricas quando o documento exigir relato objetivo
- manter coerência com o contexto institucional
- preservar clareza e legibilidade

---

## 7. Regras institucionais de operação

- registros diários confirmados devem ser tratados como imutáveis, salvo ação corretiva institucional autorizada
- exclusão de registros deve ser restrita ao coordenador, como medida corretiva controlada
- fotos de menores não devem ser armazenadas fora do fluxo institucional permitido
- imagens podem exigir inserção manual no documento exportado antes do arquivamento final
- o sistema deve priorizar compatibilidade com Google Docs, pois o fluxo institucional de finalização ocorre nesse ambiente
- toda evolução do sistema deve preservar rastreabilidade e responsabilidade institucional dos registros

---

## 8. Fluxo principal do relatório mensal

O fluxo principal do relatório mensal deve seguir a lógica abaixo:

1. o educador registra a atividade diária
2. os dados são salvos no Firestore
3. o backend consulta os registros do período
4. os registros são organizados por período, agrupamento pedagógico ou semana
5. os serviços especializados geram blocos do relatório, como:
   - atividades realizadas
   - resultados observados
   - parecer técnico
   - defesa do projeto
   - soft skills
6. o serviço de DOCX monta o documento final
7. o arquivo é exportado para download
8. fotos são inseridas manualmente, quando necessário, antes do arquivamento final no fluxo institucional

---

## 9. Escalabilidade por oficina

O sistema deve ser projetado para suportar múltiplas oficinas.

Isso significa que não se deve assumir que todas as oficinas terão:

- a mesma tela
- os mesmos campos
- os mesmos indicadores
- os mesmos critérios de acompanhamento
- os mesmos relatórios
- a mesma experiência de uso

A Oficina de Programação é a primeira implementação do sistema, mas não deve servir como molde rígido para todas as oficinas futuras.

Cada oficina pode necessitar de:

- telas próprias
- formulários próprios
- métricas próprias
- validações próprias
- relatórios próprios
- estruturas analíticas próprias

Ao criar novas funcionalidades, sempre avaliar se a regra é:

- global do sistema
- institucional comum
- exclusiva de uma oficina específica

---

## 10. Diretrizes para dados estruturados

Os dados pedagógicos do sistema não devem ser pensados apenas para geração textual de relatórios, mas também para leitura analítica futura, apoio à coordenação e tomada de decisão institucional.

### 10.1. Camada narrativa
A camada narrativa deve servir para:

- relatórios mensais
- pareceres técnicos
- defesas pedagógicas
- textos formais institucionais
- sínteses avaliativas

### 10.2. Camada estruturada
A camada estruturada deve servir para:

- filtros
- consolidações
- comparações
- indicadores
- painéis futuros
- análises com IA
- acompanhamento da coordenação

### 10.3. Princípio de modelagem
Sempre que um dado for importante para análise futura, ele não deve ficar apenas em texto corrido quando puder ser registrado também em campo estruturado.

### 10.4. Exemplos de campos comuns estruturáveis
Sempre que fizer sentido, considerar campos como:

- `oficinaId`
- `oficinaNome`
- `educadorId`
- `educadorNome`
- `coordenadorId`
- `data`
- `turma`
- `grupo`
- `semanaPedagogica`
- `statusRegistro`
- `nivelParticipacao`
- `houveIntercorrencia`
- `tipoIntercorrencia`
- `necessitaReforco`
- `observacoesNarrativas`

### 10.5. Exemplos de campos específicos por oficina
Esses campos devem variar conforme a natureza da oficina.

#### Exemplo na Oficina de Programação
- `moduloPrincipal`
- `conteudosTecnicos`
- `tecnologiasTrabalhadas`
- `dificuldadesTecnicas`
- `softSkillsObservadas`
- `tipoAtividade`
- `usoDaPlataforma`
- `andamentoProjeto`

Esses campos não devem ser impostos a outras oficinas que possuam lógica pedagógica diferente.

---

## 11. Diretrizes para análises com IA no painel do coordenador

O sistema deve ser preparado para permitir, no futuro, análises com apoio de IA voltadas ao coordenador.

Essas análises não devem depender exclusivamente de leitura de texto solto. Elas devem se apoiar em dados minimamente organizados.

### 11.1. Finalidades das análises
Exemplos de uso futuro:

- identificar recorrência de dificuldades
- comparar participação entre turmas, oficinas ou períodos
- mapear conteúdos que exigem mais reforço
- observar tendências de engajamento
- levantar intercorrências recorrentes
- apoiar decisões pedagógicas e operacionais
- produzir sínteses gerenciais por oficina ou conjunto de oficinas

### 11.2. Regra arquitetural
A estrutura analítica do sistema deve preservar:

- um núcleo institucional comum
- extensões específicas por oficina

Isso garante que diferentes áreas pedagógicas possam ser analisadas sem perda de contexto e sem rigidez indevida na modelagem.

### 11.3. Princípio de confiabilidade
A IA deve atuar como camada interpretativa e de apoio à leitura institucional, não como substituta de organização mínima dos dados.

---

## 12. Papéis institucionais e controle de acesso

A arquitetura deve evoluir considerando pelo menos dois perfis principais:

### Coordenador
Responsável por:

- cadastro administrativo
- gestão institucional do sistema
- cadastro e edição de educadores
- visualização consolidada dos registros
- exclusão corretiva de registros, quando aplicável
- acesso a análises e relatórios institucionais
- visão ampliada das oficinas sob sua responsabilidade

### Educador
Responsável por:

- registro das atividades da oficina sob sua responsabilidade
- alimentação dos dados diários
- acompanhamento do fluxo pedagógico da sua oficina
- utilização das interfaces específicas da oficina em que atua

O sistema deve ser centralizado institucionalmente, com governança do coordenador e operação distribuída entre educadores.

---

## 13. Diretrizes de arquitetura de software

### 13.1. Frontend
- `views` representam telas
- `components` representam blocos reutilizáveis ou funcionais
- lógica de interface deve permanecer no frontend
- lógica institucional complexa não deve se concentrar indevidamente nos componentes

### 13.2. Backend
- regras de negócio devem ser preferencialmente centralizadas no backend
- geração textual deve ser modularizada
- exportação documental deve ser separada da interface
- integrações sensíveis devem ser mantidas no backend

### 13.3. Middlewares
Middlewares devem concentrar:

- validações
- autenticação
- autorização
- regras transversais de acesso e proteção

### 13.4. Constants
Constants devem armazenar:

- regras fixas
- enums
- textos-base reutilizáveis
- parâmetros institucionais estáveis

### 13.5. Services
Services devem manter responsabilidade clara, evitando mistura excessiva de papéis.

Exemplos:
- orquestração do relatório
- geração de tabela diária
- geração de parecer
- geração de defesa
- geração documental
- futura análise institucional

---

## 14. Diretrizes para evolução do projeto

Toda evolução do sistema deve seguir estes princípios:

- preservar o que já funciona antes de propor refatoração ampla
- diferenciar regra global de regra específica por oficina
- priorizar clareza arquitetural
- evitar duplicação de lógica entre frontend e backend
- fazer mudanças incrementais
- testar impacto antes de expandir a alteração
- manter nomenclatura consistente
- documentar decisões estruturais importantes

### 14.1. Método recomendado de evolução
Antes de implementar qualquer funcionalidade:

1. mapear o fluxo atual
2. identificar os arquivos afetados
3. definir a menor alteração segura
4. implementar
5. revisar impacto arquitetural
6. testar
7. versionar com Git
8. atualizar a documentação quando houver decisão estrutural nova

---

### 14.2. Diretriz de debug e validação antes de correções

Antes de atribuir falhas do sistema a refatorações, ajustes recentes ou regressões de código, validar primeiro os seguintes pontos:

- existência do documento esperado no Firestore
- nomes exatos e tipos corretos dos campos
- vínculo entre Firebase Authentication e coleção `usuarios`
- uso correto do `uid` como identificador, quando aplicável
- permissões e leitura efetiva no frontend e no backend
- presença de erros silenciosos por ausência de tratamento, logs ou mensagens visíveis

Problemas de dados, autenticação, estrutura de documentos ou configuração do Firestore podem simular falhas de código e devem ser descartados antes de qualquer correção estrutural maior.

Sempre que possível, realizar o diagnóstico nesta ordem:

1. validar dados no banco
2. validar autenticação e vínculo de usuário
3. validar leitura no frontend e no backend
4. identificar erros silenciosos
5. só então propor correções no código

## 15. Próximas frentes planejadas ou já desenhadas

### Estado estável atual do relatório mensal

O ciclo de refatoração incremental do serviço `gerarRelatorioMensal.js` foi consolidado até a Fase 5, com extração de helpers, normalização, acesso a dados, processamento por dia e processamento por semana.

Neste ponto, a arquitetura do fluxo do relatório mensal é considerada estável. Novas refatorações nesse núcleo só devem ser retomadas diante de necessidade funcional real, dificuldade concreta de manutenção ou evidência clara de repetição estrutural.

Este mapeamento considera também direções já discutidas para o crescimento do sistema, tais como:

- fortalecimento da arquitetura institucional de login
- separação entre papel do coordenador e papel do educador
- criação e evolução do painel do coordenador
- futura implementação de análises com IA
- preparação para múltiplas oficinas
- criação de fluxo estruturado para plano de aulas mensal
- manutenção da geração de relatórios com alta compatibilidade com Google Docs
- organização dos dados para uso narrativo e analítico simultâneo

---

## 16. Regra de interpretação para futuras alterações

Ao analisar qualquer nova funcionalidade, sempre responder internamente a estas perguntas:

- isso é regra global do sistema ou específica de uma oficina?
- isso pertence à camada institucional comum ou à camada específica?
- esse dado precisa existir apenas em texto ou também em estrutura?
- isso pertence ao frontend ou ao backend?
- isso afeta relatório, plano de aula ou ambos?
- isso melhora escalabilidade ou aumenta acoplamento?
- isso preserva o fluxo institucional já validado?

---

## 17. Padrão para pedir suporte técnico com IA

Ao solicitar ajuda técnica, informar de forma objetiva:

- objetivo da mudança
- comportamento atual
- comportamento esperado
- arquivos envolvidos
- se a regra é institucional ou específica de oficina
- se a prioridade é correção, refatoração ou nova funcionalidade
- restrições institucionais que não podem ser quebradas

Preferir pedidos do tipo:

- analisar a responsabilidade dos arquivos envolvidos
- explicar o fluxo atual
- propor a menor alteração segura
- indicar riscos de impacto
- depois implementar de forma pontual

Evitar pedidos genéricos que levem à reescrita desnecessária de grandes blocos do projeto.

---

## 18. Síntese arquitetural do projeto

O Agente Pedagógico deve evoluir como uma plataforma institucional multi-oficinas, com:

- base comum institucional
- camadas específicas por oficina
- separação clara entre frontend e backend
- geração documental formal
- dados preparados para relatório e análise
- apoio à coordenação por meio de estrutura analítica confiável
- governança institucional do coordenador
- operação especializada dos educadores

A Oficina de Programação é a primeira implementação concreta do sistema, mas a arquitetura deve permanecer aberta, modular e preparada para expansão.