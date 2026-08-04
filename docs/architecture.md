# Arquitetura do projeto

Este documento apresenta a arquitetura do **Bolão da Copa 2026**, os principais fluxos de dados e as decisões técnicas adotadas durante o desenvolvimento.

## Visão geral

A aplicação possui um frontend React que se comunica diretamente com os serviços do Firebase e com uma API serverless hospedada na Vercel.

```text
                           ┌─────────────────────────┐
                           │ Firebase Authentication │
                           └─────────────────────────┘
                                      ↑
                                      │
Participante ou administrador         │
              ↓                       │
       Aplicação React ───────────────┼──→ Cloud Firestore
              │
              │
              └──→ API serverless da Vercel
                             │
                             ├──→ ESPN
                             │
                             └──→ OpenFootball
                                  em caso de fallback
```

Cada integração possui uma responsabilidade diferente:

* o Firebase Authentication realiza a autenticação dos usuários;
* o Cloud Firestore armazena partidas, participantes, palpites e configurações;
* a API serverless consulta e normaliza dados de partidas provenientes de fontes externas;
* o frontend apresenta os dados e executa as regras de negócio da aplicação.

## Frontend

O frontend foi desenvolvido com:

* React;
* TypeScript;
* Vite;
* Tailwind CSS.

Ele é responsável por:

* renderizar a interface;
* controlar os fluxos de autenticação;
* exibir partidas e palpites;
* registrar e atualizar palpites;
* calcular a pontuação e a classificação;
* exibir a premiação;
* permitir a conferência pública dos palpites;
* disponibilizar as funcionalidades administrativas;
* comunicar-se com o Firestore;
* consultar a API interna de partidas.

## Organização do código

A pasta `src` concentra o código principal da aplicação:

```text
src/
├── components/
│   Componentes visuais reutilizáveis e estruturas de interface.
│
├── config/
│   Configurações compartilhadas pela aplicação.
│
├── domain/
│   Regras de negócio independentes da interface e da infraestrutura.
│
├── features/
│   Componentes, hooks e funções organizados por funcionalidade.
│
├── hooks/
│   Hooks React compartilhados.
│
├── services/
│   Integrações com Firestore, Firebase Authentication e APIs.
│
├── App.tsx
│   Componente principal e composição dos fluxos da aplicação.
│
├── firebase.ts
│   Inicialização e configuração dos serviços do Firebase.
│
└── main.tsx
    Ponto de entrada da aplicação React.
```

Essa separação reduz o acoplamento entre interface, regras de negócio e serviços externos.

## Camada de domínio

A pasta `src/domain` contém funções relacionadas às regras do bolão que não dependem diretamente do React, do navegador ou do Firestore.

Entre essas regras estão:

* cálculo da pontuação;
* criação e ordenação da classificação;
* critérios de desempate;
* cálculo da premiação;
* filtros de partidas;
* bloqueio de palpites;
* validação de estados das partidas.

Essa organização permite testar as regras de negócio de forma isolada, sem precisar renderizar componentes ou acessar serviços externos.

## Autenticação

O login é realizado com uma Conta Google por meio do Firebase Authentication.

```text
Conta Google
      ↓
Firebase Authentication
      ↓
UID do usuário autenticado
      ↓
Documento players/{uid}
```

O UID fornecido pelo Firebase Authentication é utilizado como identificador principal do participante autenticado.

Após o login, a aplicação utiliza esse identificador para localizar ou criar o documento correspondente na coleção `players`.

## Persistência de dados

O Cloud Firestore armazena principalmente duas coleções:

```text
matches
players
```

A coleção `matches` contém as partidas e seus respectivos dados, como:

* seleções;
* data e horário;
* placar;
* status;
* fase da competição;
* informações adicionais da partida.

A coleção `players` contém os participantes, configurações individuais e palpites.

## Atualizações em tempo real

A aplicação utiliza listeners do Firestore por meio de `onSnapshot`.

```text
Documento alterado no Firestore
            ↓
listener onSnapshot recebe a atualização
            ↓
estado da aplicação é atualizado
            ↓
interface é renderizada novamente
```

Com isso, alterações em partidas, resultados ou participantes podem aparecer na interface sem a necessidade de recarregar a página manualmente.

## Modelo dos palpites

Os palpites são armazenados dentro do documento do participante:

```text
players/{playerId}.predictions.{matchId}
```

Cada `matchId` identifica o palpite correspondente a uma partida.

Esse modelo facilita o carregamento de todos os palpites de um participante em uma única leitura.

Como o Firestore possui limite de tamanho por documento, o volume armazenado deve ser acompanhado caso a aplicação seja adaptada para competições maiores ou para múltiplas edições.

Mais detalhes estão disponíveis em:

[Modelo de dados](data-model.md)

## API serverless

A integração com as fontes externas de partidas é realizada pela função:

```text
api/worldcup-fixtures.ts
```

Quando publicada pela Vercel, ela fica disponível no endpoint:

```text
/api/worldcup-fixtures
```

O frontend não acessa diretamente a ESPN ou o OpenFootball. Em vez disso, consulta a API interna da aplicação.

```text
Frontend
   ↓
/api/worldcup-fixtures
   ↓
consulta da fonte externa
   ↓
normalização dos dados
   ↓
resposta no formato utilizado pela aplicação
```

Essa camada evita que os componentes React precisem conhecer as diferenças entre os formatos retornados por cada fonte.

## Fontes externas de partidas

### ESPN

A ESPN é utilizada como fonte principal de partidas.

Entre os dados obtidos estão:

* seleções;
* abreviações;
* logotipos;
* datas e horários;
* placares;
* status das partidas;
* estádios;
* cidades.

A resposta externa é convertida para o modelo de partida utilizado internamente pela aplicação.

### OpenFootball

O OpenFootball é utilizado como fonte alternativa quando a ESPN:

* fica indisponível;
* retorna um erro HTTP;
* apresenta um formato inesperado;
* não retorna partidas válidas.

Como o OpenFootball possui menos informações em alguns registros, campos opcionais podem não estar disponíveis:

```text
logoA
logoB
venue
country
```

A aplicação deve continuar funcionando mesmo quando esses campos estiverem ausentes.

## Estratégia de fallback

Por padrão, a API utiliza o modo automático:

```text
source=auto
```

Nesse modo, o fluxo é:

```text
Requisição recebida
        ↓
Consultar ESPN
        ↓
Dados válidos?
   ┌────┴────┐
  Sim       Não
   ↓         ↓
Retornar   Consultar OpenFootball
dados            ↓
           normalizar resposta
                  ↓
             retornar dados
```

Também é possível selecionar uma fonte específica para testes e diagnóstico.

Exemplos:

```text
/api/worldcup-fixtures?source=auto
/api/worldcup-fixtures?source=espn
/api/worldcup-fixtures?source=openfootball
```

## Filtros da API

A API aceita parâmetros para limitar ou filtrar os resultados:

```text
/api/worldcup-fixtures?today=1
/api/worldcup-fixtures?upcoming=1
/api/worldcup-fixtures?finished=1
/api/worldcup-fixtures?limit=10
```

O parâmetro `debug=1` pode ser utilizado durante diagnósticos técnicos:

```text
/api/worldcup-fixtures?debug=1
```

Esses parâmetros são processados pela função serverless antes de a resposta ser enviada ao frontend.

## Sincronização com o Firestore

A API serverless apenas busca, valida e normaliza os dados externos.

O salvamento das partidas no Firestore é realizado pelos serviços da aplicação a partir do Painel Administrativo.

```text
Painel Administrativo
          ↓
worldCupApiService
          ↓
/api/worldcup-fixtures
          ↓
partidas normalizadas
          ↓
matchesService
          ↓
Cloud Firestore
```

Durante a sincronização, a aplicação deve preservar informações que não pertencem à fonte externa, como:

* palpites registrados;
* partidas criadas manualmente;
* configurações administrativas;
* ajustes realizados dentro da aplicação.

A atualização deve alterar apenas os campos relacionados aos dados da partida.

## Cálculo da classificação

A pontuação e a classificação são calculadas no frontend por meio de funções da camada de domínio.

O fluxo principal é:

```text
Partidas finalizadas + palpites dos jogadores
                     ↓
             cálculo da pontuação
                     ↓
            critérios de desempate
                     ↓
             classificação ordenada
```

Essa decisão foi adotada porque o volume de participantes e partidas do bolão é pequeno.

Para o contexto atual, não é necessário manter um servidor dedicado ou uma coleção adicional apenas para armazenar a classificação calculada.

## Segurança e autorização

A aplicação possui duas responsabilidades distintas:

```text
Frontend
→ controla o que é apresentado na interface.

Firestore Security Rules
→ controlam quais operações são permitidas no banco.
```

A variável:

```text
VITE_ADMIN_EMAILS
```

é utilizada pelo frontend para identificar quais usuários devem visualizar as funcionalidades administrativas.

Entretanto, ela não deve ser considerada uma barreira de segurança, pois o código do frontend pode ser inspecionado ou modificado pelo navegador.

As permissões efetivas de leitura e escrita são definidas no arquivo:

```text
firestore.rules
```

Operações administrativas devem ser validadas pelas regras do Firestore com base no usuário autenticado e nas permissões previstas pelo sistema.

## Variáveis de ambiente

As configurações necessárias para executar o projeto estão documentadas no arquivo:

```text
.env.example
```

Elas incluem:

* configuração do Firebase;
* identificação dos administradores;
* configuração opcional dos emuladores locais.

Os valores específicos de cada ambiente não fazem parte da arquitetura e devem ser configurados separadamente no ambiente local ou na Vercel.

## Decisões arquiteturais

### Por que utilizar uma função serverless?

A função serverless permite:

* centralizar a integração com fontes externas;
* ocultar dos componentes o formato específico de cada provedor;
* normalizar as respostas;
* aplicar fallback;
* centralizar o tratamento de erros;
* substituir a fonte de dados sem alterar a interface;
* executar a integração sem manter um servidor próprio continuamente ativo.

### Por que utilizar o Firebase?

O Firebase fornece os recursos necessários para o volume e o contexto atual da aplicação:

* autenticação com Conta Google;
* persistência dos dados;
* atualizações em tempo real;
* regras de autorização;
* infraestrutura gerenciada.

Essa escolha reduziu a necessidade de criar e hospedar um backend tradicional apenas para autenticação e persistência.

### Por que calcular a classificação no frontend?

O número de participantes e partidas é pequeno, tornando o cálculo rápido e de baixo custo.

A lógica está isolada em funções de domínio, o que facilita:

* testes automatizados;
* manutenção;
* revisão das regras;
* alteração dos critérios de pontuação;
* reutilização em diferentes componentes.

Caso o volume de dados aumente significativamente, esse cálculo poderá ser movido para uma função backend ou para um processo de atualização de classificação persistida.

### Por que armazenar os palpites dentro do participante?

O modelo atual:

```text
players/{playerId}.predictions.{matchId}
```

permite carregar todos os palpites de um participante junto com seu documento.

Essa estrutura simplifica:

* a tela individual de palpites;
* a conferência por participante;
* o cálculo da pontuação;
* a manutenção do estado no frontend.

A principal limitação é o crescimento do documento do participante. Para o volume atual do bolão, essa abordagem é suficiente.
