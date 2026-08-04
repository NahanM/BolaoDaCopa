# Modelo de dados

Este documento descreve a estrutura dos dados persistidos no Cloud Firestore pelo **Bolão da Copa 2026**.

As principais coleções são:

```text
matches
players
```

## Convenções

### Identificadores

O identificador do documento no Firestore é considerado a fonte de verdade.

Quando um campo interno `id` estiver presente, ele deve possuir o mesmo valor do identificador do documento.

### Campos opcionais

Campos marcados com `?` podem não existir em documentos antigos ou quando a fonte externa não fornece a informação.

### Datas

A aplicação utiliza principalmente:

* strings no formato ISO;
* timestamps em milissegundos.

Os serviços de normalização podem aceitar outros formatos provenientes de documentos antigos, mas os dados disponibilizados para a aplicação devem ser convertidos para o formato esperado.

## Partidas

### Caminho

```text
matches/{matchId}
```

Cada documento representa uma partida.

### Estrutura

```ts
interface Match {
  id: string;
  apiFixtureId?: string;

  teamA: string;
  teamB: string;

  shortTeamA?: string;
  shortTeamB?: string;

  flagA?: string;
  flagB?: string;

  logoA?: string;
  logoB?: string;

  date: string;
  time: string;

  startsAt: string;
  startsAtMs: number;

  status: 'scheduled' | 'finished';

  scoreA?: number;
  scoreB?: number;

  group: string;

  venue?: string;
  city?: string;
  country?: string;

  source?: 'espn' | 'openfootball';
}
```

### Campos principais

| Campo          | Tipo     | Obrigatório | Descrição                                            |
| -------------- | -------- | ----------: | ---------------------------------------------------- |
| `id`           | `string` |         sim | Identificador utilizado internamente pela aplicação. |
| `apiFixtureId` | `string` |         não | Identificador recebido da fonte externa.             |
| `teamA`        | `string` |         sim | Nome da primeira seleção.                            |
| `teamB`        | `string` |         sim | Nome da segunda seleção.                             |
| `date`         | `string` |         sim | Data formatada para exibição.                        |
| `time`         | `string` |         sim | Horário formatado para exibição.                     |
| `startsAt`     | `string` |         sim | Data e horário em formato ISO.                       |
| `startsAtMs`   | `number` |         sim | Horário de início em milissegundos.                  |
| `status`       | `string` |         sim | Estado normalizado da partida.                       |
| `scoreA`       | `number` |         não | Placar da primeira seleção.                          |
| `scoreB`       | `number` |         não | Placar da segunda seleção.                           |
| `group`        | `string` |         sim | Grupo ou fase da competição.                         |
| `source`       | `string` |         não | Fonte externa de origem dos dados.                   |

### Identificador da partida

O `matchId` também é utilizado como chave nos palpites:

```text
players/{playerId}.predictions.{matchId}
```

Por isso, alterar o identificador de uma partida já utilizada pode fazer com que os palpites existentes deixem de ser associados a ela.

### Data e horário

Exemplo:

```text
date: "11/06/2026"
time: "16:00"
startsAt: "2026-06-11T19:00:00.000Z"
startsAtMs: 1781204400000
```

`date` e `time` são utilizados principalmente para exibição.

`startsAt` e `startsAtMs` representam o instante da partida e são utilizados para comparações e bloqueio de palpites.

### Status e placar

Os estados normalizados atualmente são:

```text
scheduled
finished
```

Quando `status` for `finished`, espera-se que `scoreA` e `scoreB` estejam preenchidos.

## Participantes

### Caminho

```text
players/{playerId}
```

Para participantes autenticados, o identificador normalmente corresponde ao UID fornecido pelo Firebase Authentication.

### Estrutura

```ts
interface Player {
  id: string;

  name: string;
  avatar: string;
  email: string;

  predictions: Record<string, Prediction>;

  points: number;
  exactHits: number;
  partialHits: number;
  errorHits: number;

  manualPointsAdjustment: number;
  manualPointsAdjustmentUpdatedAt?: string;

  lastPredictionMatchId?: string;

  isAdmin: boolean;
}
```

### Campos principais

| Campo                    | Tipo      | Obrigatório | Descrição                              |
| ------------------------ | --------- | ----------: | -------------------------------------- |
| `id`                     | `string`  |         sim | Identificador do participante.         |
| `name`                   | `string`  |         sim | Nome exibido na aplicação.             |
| `avatar`                 | `string`  |         sim | Identificador do avatar selecionado.   |
| `email`                  | `string`  |         sim | E-mail normalizado do participante.    |
| `predictions`            | `object`  |         sim | Palpites indexados pelo ID da partida. |
| `points`                 | `number`  |         sim | Pontuação armazenada ou calculada.     |
| `exactHits`              | `number`  |         sim | Quantidade de placares exatos.         |
| `partialHits`            | `number`  |         sim | Quantidade de acertos parciais.        |
| `errorHits`              | `number`  |         sim | Quantidade de palpites incorretos.     |
| `manualPointsAdjustment` | `number`  |         sim | Ajuste administrativo de pontuação.    |
| `isAdmin`                | `boolean` |         sim | Indica função administrativa.          |

### E-mail

O e-mail é armazenado em formato normalizado e pode ser utilizado para:

* localizar contas existentes;
* identificar participantes duplicados;
* associar documentos antigos;
* auxiliar na identificação de administradores.

O UID da autenticação deve continuar sendo o identificador principal sempre que disponível.

## Palpites

Os palpites ficam armazenados dentro do documento do participante.

### Caminho lógico

```text
players/{playerId}.predictions.{matchId}
```

### Estrutura

```ts
interface Prediction {
  scoreA: number;
  scoreB: number;
  createdAt: string;
  updatedAt: string;
}
```

### Exemplo

```ts
{
  predictions: {
    "760506": {
      scoreA: 2,
      scoreB: 1,
      createdAt: "2026-05-10T12:00:00.000Z",
      updatedAt: "2026-05-10T12:30:00.000Z"
    }
  }
}
```

A chave `760506` corresponde ao identificador da partida em:

```text
matches/760506
```

## Relacionamentos

O Firestore não possui relacionamento por chave estrangeira, mas a aplicação mantém uma associação lógica entre partidas e palpites.

```text
matches/{matchId}
        ↑
        │
players/{playerId}.predictions.{matchId}
```

A integridade dessa associação depende da preservação do identificador da partida.

## Campos derivados

Os seguintes campos podem ser recalculados a partir das partidas e dos palpites:

```text
points
exactHits
partialHits
errorHits
```

Eles não devem ser considerados a única fonte de verdade para a classificação.

O campo:

```text
manualPointsAdjustment
```

é somado ao resultado calculado e representa uma alteração administrativa explícita.

As regras completas de cálculo estão documentadas em:

[Regras de negócio](business-rules.md)

## Normalização e compatibilidade

Os documentos passam por normalização antes de serem utilizados pela aplicação.

A normalização trata situações como:

* campos ausentes;
* valores nulos;
* números armazenados como texto;
* formatos diferentes de data;
* documentos criados por versões antigas;
* divergência entre o ID do documento e o campo interno `id`.

Quando houver divergência, o identificador do documento no Firestore deve prevalecer.

## Limitações do modelo

Os palpites são armazenados dentro do documento do participante.

Essa estrutura simplifica a leitura dos palpites de um único jogador, mas faz com que o documento cresça conforme novas partidas são adicionadas.

Para o volume atual da aplicação, esse modelo é suficiente. Caso o sistema passe a armazenar várias competições ou um número muito maior de partidas, pode ser necessário mover os palpites para uma subcoleção:

```text
players/{playerId}/predictions/{matchId}
```

ou para uma coleção independente.
