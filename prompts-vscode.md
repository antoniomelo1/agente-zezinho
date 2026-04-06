1. Prompt para entender um arquivo

Use quando abrir um arquivo e quiser entender de verdade o papel dele.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Analise este arquivo e explique de forma objetiva:

1. qual é a responsabilidade dele no sistema
2. o que ele recebe
3. o que ele produz ou retorna
4. com quais outros arquivos ele se relaciona
5. se há sinais de acoplamento excessivo, duplicação ou mistura de responsabilidades
6. quais cuidados devo ter antes de alterá-lo

Não reescreva o arquivo. Primeiro quero entendimento arquitetural.




2. Prompt para entender o fluxo entre arquivos

Use quando uma funcionalidade depende de vários arquivos.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Analise os arquivos abaixo em conjunto e explique:

1. o papel de cada arquivo
2. o fluxo atual entre eles
3. onde começa e onde termina essa funcionalidade
4. quais pontos são frontend e quais são backend
5. qual arquivo parece ser o maestro do fluxo
6. quais riscos existem se eu alterar esse conjunto

Quero primeiro o mapa do fluxo. Não implemente nada ainda.

Arquivos:
- [colar aqui os caminhos dos arquivos]




3. Prompt para correção segura de bug

Use quando algo está quebrado, mas você quer evitar remendo perigoso.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Tenho um problema nesta funcionalidade.

Problema atual:
[descreva aqui]

Arquivos envolvidos:
- [arquivo 1]
- [arquivo 2]

Quero que você:

1. analise a causa mais provável do problema
2. explique a lógica do erro
3. proponha a menor alteração segura possível
4. aponte riscos de impacto
5. só depois escreva a alteração necessária

Não reescreva arquivos inteiros sem necessidade.
Priorize correção pontual, clara e compatível com a arquitetura atual.




4. Prompt para nova funcionalidade com impacto controlado

Use quando quiser adicionar algo novo sem bagunçar o sistema.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Quero implementar esta funcionalidade:
[descreva aqui]

Contexto:
[explique onde isso entra no sistema]

Arquivos possivelmente envolvidos:
- [arquivo 1]
- [arquivo 2]

Quero que você responda em 4 etapas:

1. explique onde essa funcionalidade deve morar na arquitetura
2. diga quais arquivos realmente precisam ser alterados
3. proponha a menor solução segura e escalável
4. implemente de forma pontual, sem refatoração ampla desnecessária

Considere se a regra é global do sistema ou específica de uma oficina.





5. Prompt para decidir entre frontend e backend

Use quando estiver em dúvida sobre onde colocar a lógica.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Estou em dúvida sobre onde esta lógica deve ficar: frontend ou backend.

Regra ou funcionalidade:
[descreva aqui]

Arquivos relacionados:
- [arquivo 1]
- [arquivo 2]

Analise e explique:

1. o que pertence à interface
2. o que pertence à regra de negócio
3. o que deve ficar no frontend
4. o que deve ficar no backend
5. qual divisão faz mais sentido para escalabilidade, segurança e manutenção

Quero decisão arquitetural antes do código.




6. Prompt para refatoração pontual

Use quando o código funciona, mas está confuso ou misturado.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Este trecho ou conjunto de arquivos está funcionando, mas quero melhorar a organização sem quebrar o comportamento atual.

Arquivos:
- [arquivo 1]
- [arquivo 2]

Quero que você:

1. identifique os principais problemas de organização
2. diga o que realmente vale refatorar agora
3. proponha a menor refatoração segura
4. preserve o comportamento já validado
5. implemente apenas o necessário

Evite refatoração grande por estética. Priorize clareza, manutenção e segurança.





7. Prompt para revisão institucional de textos gerados

Use quando for revisar prompts ou textos institucionais do sistema.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Analise este texto ou prompt institucional e verifique se ele está alinhado com as regras do projeto.

Quero que você avalie:

1. se a linguagem está formal, objetiva e institucional
2. se o tempo verbal está adequado ao tipo de documento
3. se evita a palavra "alunos"
4. se respeita o contexto da Casa do Zezinho
5. se há trechos genéricos, repetitivos ou inadequados
6. quais ajustes melhorariam a qualidade institucional

Texto para análise:
[colar aqui]




8. Prompt para recursos multi-oficinas

Use sempre que surgir uma funcionalidade que talvez sirva para várias oficinas.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Quero analisar esta funcionalidade com visão multi-oficinas:
[descreva aqui]

Explique:

1. o que é base institucional comum
2. o que parece ser específico da Oficina de Programação
3. como evitar transformar uma regra da Programação em regra global indevida
4. como modelar isso para suportar futuras oficinas
5. quais arquivos ou camadas devem permanecer genéricos e quais podem ser específicos

Quero decisão arquitetural com foco em escalabilidade.




9. Prompt para dados estruturados e análise com IA

Use quando pensar em coordenação, filtros, indicadores e leitura analítica.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Quero preparar esta funcionalidade para análise futura com IA no painel do coordenador:
[descreva aqui]

Analise e proponha:

1. quais dados podem continuar narrativos
2. quais dados precisam ser estruturados
3. quais campos comuns seriam úteis institucionalmente
4. quais campos seriam específicos da oficina
5. como isso pode apoiar filtros, comparações e sínteses futuras
6. qual a menor alteração segura para começar essa evolução

Não pense apenas em geração de texto. Pense também em leitura analítica.




10. Prompt para análise de impacto antes de mexer

Use quando estiver com medo de quebrar algo.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Antes de implementar qualquer mudança, quero uma análise de impacto.

Mudança desejada:
[descreva aqui]

Arquivos envolvidos:
- [arquivo 1]
- [arquivo 2]
- [arquivo 3]

Explique:

1. quais fluxos podem ser afetados
2. quais comportamentos podem quebrar
3. quais dependências precisam ser verificadas
4. qual ordem de alteração é mais segura
5. como testar essa mudança com segurança

Não implemente ainda. Primeiro quero avaliação de risco.




11. Prompt para revisão final antes de aplicar código

Use quando a IA já propôs algo e você quer filtrar melhor.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Revise a solução proposta com senso crítico.

Quero que você verifique:

1. se a solução respeita a arquitetura atual
2. se a mudança está maior do que deveria
3. se existe alternativa mais simples
4. se houve mistura indevida entre frontend e backend
5. se a solução respeita escalabilidade por oficina
6. se o impacto está proporcional ao problema

Se houver exagero, reduza a solução para a menor alteração segura.




12. Prompt para virar mudança em plano de ação

Use quando quiser transformar uma ideia grande em execução organizada.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Quero transformar esta ideia em plano de implementação:
[descreva aqui]

Monte um plano objetivo contendo:

1. meta da mudança
2. arquivos ou camadas afetadas
3. ordem recomendada de implementação
4. riscos principais
5. testes essenciais
6. o que pode ficar para uma segunda etapa

Quero um plano incremental, sem big bang.




13. Prompt para revisar componente Vue

Use quando abrir um .vue e quiser avaliar qualidade e organização.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Analise este componente Vue e explique:

1. qual a responsabilidade dele
2. o que nele é interface
3. o que nele parece regra de negócio
4. o que deveria permanecer aqui
5. o que poderia ser extraído no futuro
6. se há acoplamento excessivo, duplicação ou complexidade desnecessária

Quero análise com foco em manutenção e arquitetura, sem refatorar por refatorar.




14. Prompt para revisar service do backend

Use especialmente nos arquivos do server/services.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Analise este service do backend e explique:

1. qual problema ele resolve
2. quais entradas ele recebe
3. quais saídas produz
4. com quais outros serviços ou arquivos ele depende
5. se a responsabilidade dele está clara
6. se ele está assumindo funções demais
7. qual o menor ajuste recomendado para melhorar clareza ou manutenção

Quero leitura de arquitetura e responsabilidade antes de qualquer alteração.




15. Prompt mestre para trabalhar como Maestro de Código

Esse é o prompt mais forte para usar quando quiser um nível mais profissional.

Leia e respeite o arquivo instrucoes.md e considere também as regras do .cursorrules do projeto Agente Pedagógico.

Quero trabalhar esta demanda como análise arquitetural e implementação segura, não como simples geração de código.

Demanda:
[descreva aqui]

Contexto:
[descreva aqui]

Arquivos envolvidos:
- [arquivo 1]
- [arquivo 2]
- [arquivo 3]

Responda nesta ordem:

1. leitura do problema
2. entendimento do fluxo atual
3. classificação da regra:
   - global do sistema
   - institucional comum
   - específica de oficina
4. decisão de onde a lógica deve ficar
5. menor alteração segura
6. riscos de impacto
7. implementação pontual
8. sugestão de testes
9. observação arquitetural para o futuro

Evite exageros, reescritas desnecessárias e soluções que aumentem acoplamento.