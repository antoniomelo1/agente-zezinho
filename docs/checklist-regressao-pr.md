# Checklist de Regressão antes do PR

## 1. Escopo
- [ ] A alteração ficou limitada ao objetivo do PR
- [ ] Nenhum arquivo fora do escopo foi alterado sem justificativa
- [ ] Não houve refatoração desnecessária

## 2. Regras institucionais
- [ ] A linguagem institucional foi preservada
- [ ] O sistema continua evitando o termo "alunos" nos relatórios oficiais
- [ ] Os termos "zezinhos", "jovens", "participantes" ou equivalentes continuam sendo usados corretamente
- [ ] A lógica da Oficina de Programação foi respeitada

## 3. Permissões
- [ ] O educador continua com acesso apenas ao que deve acessar
- [ ] O coordenador continua com permissões administrativas corretas
- [ ] Nenhuma regra de autenticação/autorização foi enfraquecida

## 4. Dados e Firestore
- [ ] Não há risco de perda de dados
- [ ] Não há escrita direta indevida pelo frontend
- [ ] As coleções e campos existentes continuam compatíveis
- [ ] Nenhuma estrutura foi quebrada para registros antigos

## 5. Funcionalidades relacionadas
- [ ] Registro diário continua funcionando
- [ ] Plano mensal continua funcionando
- [ ] Relatório mensal continua funcionando
- [ ] Ocorrências de calendário continuam funcionando, se aplicável
- [ ] Exportação DOCX continua funcionando

## 6. Interface
- [ ] A tela funciona em desktop
- [ ] A tela funciona em celular
- [ ] Botões, mensagens e estados de carregamento continuam claros
- [ ] Nenhuma informação sensível ficou exposta na interface

## 7. Testes manuais
- [ ] Testado fluxo feliz
- [ ] Testado campo vazio ou inválido
- [ ] Testado usuário educador
- [ ] Testado usuário coordenador
- [ ] Testado cenário com dados antigos
- [ ] Testado erro de rede ou falha de API, quando aplicável

## 8. Revisão final
- [ ] A IA revisou o PR sem alterar código
- [ ] Os riscos apontados foram avaliados por humano
- [ ] O PR está pronto para merge