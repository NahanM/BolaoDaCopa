# Manutenção e administração

Este documento orienta a manutenção do **Bolão da Copa 2026** após sua publicação.

O objetivo é permitir que outro desenvolvedor consiga administrar a aplicação, publicar alterações, corrigir dados e diagnosticar problemas sem depender do conhecimento de quem desenvolveu o sistema originalmente.

Para compreender a estrutura interna antes de realizar alterações, consulte:

* [Arquitetura do projeto](architecture.md)
* [Modelo de dados](data-model.md)
* [Testes do projeto](testing.md)

## 1. Visão geral da operação

A aplicação utiliza:

* Vercel para hospedagem do frontend e das funções serverless;
* Firebase Authentication para login com Conta Google;
* Cloud Firestore para armazenamento dos dados;
* Firestore Security Rules para autorização;
* uma API serverless para consulta e normalização das partidas.

Os principais pontos de manutenção são:

* publicação de novas versões;
* publicação das regras do Firestore;
* gerenciamento de administradores;
* cadastro e correção de partidas;
* lançamento de resultados;
* sincronização de partidas;
* correção de pontuação;
* diagnóstico de falhas.

## 2. Acessos necessários

Quem assumir a manutenção deve possuir acesso aos seguintes serviços:

* repositório GitHub;
* projeto da Vercel;
* projeto do Firebase;
* Firebase Authentication;
* Cloud Firestore;
* configuração das variáveis de ambiente;
* Conta Google autorizada como administradora da aplicação.

As credenciais e permissões de acesso devem ser transferidas pelos responsáveis pelo projeto. Elas não são armazenadas no repositório.

## 3. Preparação do ambiente local

Clone o repositório e instale as dependências:

```bash
git clone URL_DO_REPOSITORIO
cd bolaodacopa
npm ci
```

Crie o arquivo `.env.local` com base no `.env.example` e configure os dados do ambiente Firebase que será utilizado.

Inicie a aplicação:

```bash
npm run dev
```

Antes de trabalhar em produção, confirme que o ambiente local está conectado ao projeto Firebase correto.

## 4. Validação antes de publicar alterações

Antes de qualquer deploy, execute:

```bash
npm run test:all
npm run build
git status
git diff
```

A publicação não deve ser realizada enquanto houver:

* erro de TypeScript;
* falha nos testes;
* erro de build;
* alteração inesperada no `git diff`;
* arquivo de configuração local incluído no commit;
* mudança nas regras de segurança sem revisão.

Os testes disponíveis estão documentados em [Testes do projeto](testing.md).

## 5. Deploy da aplicação

O frontend e as funções da pasta `api` são publicados pela Vercel.

O fluxo normal de publicação é:

```text
Alteração no código
        ↓
Testes e build local
        ↓
Commit no Git
        ↓
Push para o repositório
        ↓
Deploy automático na Vercel
        ↓
Validação em produção
```

Antes do push, confirme qual branch está conectada ao ambiente de produção.

Depois da publicação, verifique o painel da Vercel para confirmar:

* conclusão do build;
* ausência de erros no deploy;
* carregamento correto das variáveis de ambiente;
* funcionamento da função `/api/worldcup-fixtures`.

Alterações nas variáveis da Vercel exigem um novo deploy para serem incorporadas ao frontend.

## 6. Publicação das Firestore Security Rules

As regras de autorização estão no arquivo:

```text
firestore.rules
```

Depois de alterá-las, execute:

```bash
npm run deploy:rules
```

Modificar o arquivo local não altera automaticamente as regras publicadas.

Antes de publicar, verifique:

* quem pode criar ou editar partidas;
* quem pode alterar resultados;
* quais campos cada participante pode modificar;
* quem pode acessar os palpites;
* quais operações exigem permissão administrativa.

Depois da publicação, teste tanto com uma conta administrativa quanto com uma conta comum.

## 7. Administração e autorização

A aplicação possui uma diferença importante entre **exibição do painel** e **autorização real**.

### Exibição do Painel Administrativo

A variável:

```text
VITE_ADMIN_EMAILS
```

é utilizada pelo frontend para decidir quais contas visualizam a área administrativa.

Exemplo:

```env
VITE_ADMIN_EMAILS="admin1@example.com,admin2@example.com"
```

Depois de modificar essa variável na Vercel, realize um novo deploy.

### Permissão no Firestore

Um participante também pode possuir:

```text
players/{uid}.isAdmin = true
```

Entretanto, o campo `isAdmin` e a variável `VITE_ADMIN_EMAILS` só oferecem segurança quando as Firestore Rules validam corretamente a permissão do usuário autenticado.

A fonte definitiva de autorização é:

```text
firestore.rules
```

Nunca considere apenas o fato de o Painel Administrativo estar oculto no frontend como uma proteção suficiente.

## 8. Gerenciamento de partidas

As partidas podem ser cadastradas e editadas pelo Painel Administrativo.

Entre os principais dados estão:

* seleções;
* data;
* horário;
* fase ou grupo;
* placar;
* status;
* estádio;
* cidade;
* identificadores externos.

A estrutura completa dos documentos está descrita em [Modelo de dados](data-model.md).

### Cadastro manual

Para cadastrar uma partida:

```text
Painel ADM → Gerenciar jogos → Novo jogo
```

Confirme principalmente:

* nomes das seleções;
* data e horário;
* fase da competição;
* status inicial;
* identificador utilizado.

O cadastro deve gerar corretamente os campos relacionados ao início da partida, especialmente:

```text
startsAt
startsAtMs
```

### Edição de uma partida

Antes de editar, verifique se a partida já possui palpites associados.

Os palpites utilizam o ID da partida como chave:

```text
players/{playerId}.predictions.{matchId}
```

Não altere o ID de uma partida existente sem também migrar os palpites associados.

Trocar somente o ID da partida pode fazer com que os palpites deixem de ser encontrados pelo sistema.

## 9. Datas, horários e bloqueio de palpites

Os campos principais relacionados ao início de uma partida são:

```text
date
time
startsAt
startsAtMs
```

`startsAt` representa a data e o horário em formato ISO.

`startsAtMs` representa o mesmo instante em milissegundos e é utilizado pelo sistema para controlar o bloqueio dos palpites.

Os campos:

```text
createdAt
updatedAt
```

indicam quando o documento foi criado ou atualizado. Eles não controlam o início da partida.

Ao corrigir horários, confirme:

* o fuso horário utilizado;
* a correspondência entre `date`, `time`, `startsAt` e `startsAtMs`;
* se o bloqueio ocorre no horário esperado;
* se a partida ainda está com o status correto.

## 10. Lançamento e correção de resultados

Os resultados devem ser lançados pelo Painel Administrativo.

Uma partida finalizada deve possuir:

```text
status = "finished"
scoreA
scoreB
```

A classificação é calculada a partir:

* das partidas finalizadas;
* dos placares;
* dos palpites dos participantes;
* dos ajustes manuais.

Depois de alterar um resultado, valide:

* pontuação do placar exato;
* pontuação por vencedor ou empate;
* quantidade de acertos exatos;
* critérios de desempate;
* posição dos participantes no ranking.

Não utilize a edição direta de campos derivados como forma principal de corrigir a classificação.

## 11. Ajustes manuais de pontuação

Quando for necessário aplicar uma correção excepcional, utilize o recurso de ajuste manual do Painel Administrativo.

O valor é armazenado em:

```text
manualPointsAdjustment
```

O ajuste pode ser positivo ou negativo, conforme a necessidade.

Campos como pontuação total e quantidade de acertos devem continuar sendo calculados com base nos resultados e palpites.

Antes de aplicar um ajuste:

1. confirme o participante correto;
2. registre o motivo da alteração;
3. valide o valor informado;
4. confira o ranking após a atualização.

O ajuste manual não deve substituir a correção de uma partida ou de um palpite cadastrado incorretamente.

## 12. Sincronização de partidas

A sincronização é iniciada pelo Painel Administrativo e utiliza:

```text
/api/worldcup-fixtures
```

A API consulta as fontes externas, normaliza os dados e devolve as partidas no formato esperado pela aplicação.

O fluxo é:

```text
Painel Administrativo
          ↓
Serviço de sincronização
          ↓
/api/worldcup-fixtures
          ↓
Normalização das partidas
          ↓
Atualização no Firestore
```

A sincronização deve preservar:

* participantes;
* palpites;
* ajustes manuais;
* configurações administrativas;
* dados adicionados manualmente que não existam na fonte externa.

A descrição completa das fontes e da estratégia de fallback está em [Arquitetura do projeto](architecture.md).

## 13. Cuidados com identificadores externos

Fontes diferentes podem utilizar IDs diferentes para representar a mesma partida.

Exemplo:

```text
ESPN: 760506
OpenFootball: 49
```

Por isso, alternar entre fontes sem uma estratégia de associação pode criar partidas duplicadas.

Antes de realizar uma sincronização por uma fonte diferente:

1. verifique os IDs retornados;
2. confira se as partidas já existem no Firestore;
3. compare seleções, data e horário;
4. execute a sincronização com uma quantidade limitada;
5. revise o resultado antes de importar todas as partidas.

Não utilize apenas o ID externo como critério de identificação quando houver possibilidade de alternância entre fontes.

## 14. Configuração do palpite de campeão

Quando a modalidade estiver ativa, o Painel Administrativo pode controlar:

* habilitação do palpite;
* seleção escolhida;
* condição ou data de bloqueio;
* mensagens apresentadas aos participantes.

Depois de alterar a configuração, teste:

* visualização da opção;
* registro da escolha;
* atualização da escolha;
* bloqueio depois do prazo;
* comportamento para usuários comuns.

As restrições do frontend devem estar alinhadas às validações aplicadas no banco.

## 15. Backup antes de operações de risco

Realize backup antes de operações que possam modificar muitos documentos.

Isso inclui:

* exclusão de partidas;
* alteração de IDs;
* consolidação de participantes;
* sincronizações amplas;
* alteração da estrutura dos documentos;
* limpeza de dados;
* mudanças nas regras de segurança.

Antes da operação, registre:

* quantidade de partidas;
* quantidade de participantes;
* quantidade aproximada de palpites;
* documentos que serão alterados;
* estado atual da classificação.

Depois da operação, compare os dados e valide os principais fluxos da aplicação.

## 16. Validação depois do deploy

Depois de cada publicação em produção, valide:

```text
[ ] página inicial carregou
[ ] login com Google funcionou
[ ] partidas foram exibidas
[ ] filtros funcionaram
[ ] palpites foram carregados
[ ] classificação foi calculada
[ ] premiação foi exibida
[ ] endpoint de partidas respondeu
[ ] Painel Administrativo apareceu para uma conta autorizada
[ ] conta comum não conseguiu executar operações administrativas
```

Quando o deploy incluir alterações no banco ou nas regras, teste também:

```text
[ ] gravação de palpite
[ ] edição de partida
[ ] lançamento de resultado
[ ] atualização do ranking
[ ] bloqueio de palpite
[ ] permissão das Firestore Rules
```

## 17. Diagnóstico de problemas

### Painel Administrativo não aparece

Verifique:

* o e-mail da conta autenticada;
* o valor de `VITE_ADMIN_EMAILS`;
* o campo `players/{uid}.isAdmin`, quando utilizado;
* se as variáveis foram atualizadas no ambiente correto;
* se um novo deploy foi realizado após a alteração.

### Erro de permissão no Firestore

Verifique:

* se o usuário está autenticado;
* o UID da conta;
* o documento correspondente em `players`;
* o campo `isAdmin`;
* as regras locais;
* se as regras foram publicadas;
* se o projeto Firebase correto está selecionado.

Consulte também os logs do navegador e do Firebase para identificar qual operação foi negada.

### Sincronização retorna erro

Utilize o modo de diagnóstico:

```text
/api/worldcup-fixtures?debug=1
```

Confira:

* fonte consultada;
* status HTTP retornado;
* mensagem de erro;
* quantidade de partidas encontradas;
* formato das primeiras partidas;
* logs da função serverless na Vercel.

### Sincronização cria partidas duplicadas

Verifique:

* IDs externos;
* data e horário das partidas;
* nomes normalizados das seleções;
* fonte utilizada;
* existência prévia da partida no Firestore;
* serviço responsável por associar partidas importadas às já existentes.

Interrompa sincronizações amplas até identificar o critério que falhou.

### Partida não bloqueia os palpites

Verifique:

```text
startsAt
startsAtMs
status
```

Confirme também:

* fuso horário;
* formato da data;
* horário salvo no Firestore;
* horário atual do dispositivo;
* regra utilizada pelo frontend para bloquear a edição.

### Classificação não foi atualizada

Verifique:

* se a partida está com `status = "finished"`;
* se `scoreA` e `scoreB` estão preenchidos;
* se o ID da partida corresponde ao `matchId` dos palpites;
* se os documentos foram normalizados corretamente;
* se existe algum ajuste manual;
* se ocorreu erro durante o cálculo da classificação.

### Login com Google não funciona

Verifique:

* configuração do Firebase Authentication;
* domínio autorizado no Firebase;
* variáveis de ambiente;
* URL de produção;
* mensagens exibidas no console do navegador;
* possíveis bloqueios de popup.

## 18. Reversão de uma publicação

Quando uma nova versão apresentar erro crítico:

1. interrompa novas alterações;
2. identifique o último deploy estável na Vercel;
3. restaure ou promova o deploy anterior;
4. verifique se houve alteração no Firestore;
5. reverta separadamente regras ou dados, quando necessário;
6. valide os principais fluxos novamente.

Reverter o frontend não reverte automaticamente:

* documentos alterados no Firestore;
* Firestore Security Rules;
* variáveis de ambiente;
* operações administrativas realizadas.

Cada parte deve ser avaliada separadamente.

## 19. Atualização deste documento

Este manual deve ser atualizado quando houver mudanças em:

* processo de deploy;
* estrutura de autorização;
* campos essenciais das partidas;
* forma de cálculo da classificação;
* estratégia de sincronização;
* procedimentos administrativos;
* integrações externas;
* comandos de teste ou publicação.

Informações temporárias, tarefas pendentes e histórico de migrações não devem ser mantidos aqui. Esses itens devem ser registrados em issues, pull requests ou documentos específicos.
