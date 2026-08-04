import type {
  Match,
  Player,
  Prediction,
} from '../../types';

// Representa uma linha da tabela
// de auditoria de palpites.
//
// Cada linha reúne:
//
// - uma partida;
// - um participante;
// - o palpite desse participante
//   para essa partida.
export interface PredictionAuditRow {
  // Identificador único da linha.
  //
  // É formado pelo ID da partida
  // junto com o ID do participante.
  //
  // Exemplo:
  //
  // "m10-player-3"
  key: string;

  // Partida relacionada ao palpite.
  match: Match;

  // Participante que realizou o palpite.
  player: Player;

  // Palpite feito pelo participante
  // para a partida.
  prediction: Prediction;
}

// Representa o resultado de uma paginação.
//
// O <T> torna essa interface genérica.
//
// Isso significa que ela pode paginar
// qualquer tipo de dado:
//
// PaginatedRows<PredictionAuditRow>
// PaginatedRows<Player>
// PaginatedRows<Match>
export interface PaginatedRows<T> {
  // Itens que pertencem
  // à página atual.
  rows: T[];

  // Número da página atual.
  page: number;

  // Quantidade máxima de itens
  // por página.
  pageSize: number;

  // Quantidade total de itens
  // antes da paginação.
  totalRows: number;

  // Quantidade total de páginas.
  totalPages: number;

  // Número visual do primeiro item
  // exibido na página.
  //
  // Exemplo:
  // página mostrando itens 11 até 20.
  //
  // startRow será 11.
  startRow: number;

  // Número visual do último item
  // exibido na página.
  //
  // No mesmo exemplo,
  // endRow será 20.
  endRow: number;
}

// Cria as linhas utilizadas
// na auditoria de palpites.
//
// A função recebe:
//
// - todas as partidas;
// - todos os participantes.
//
// Depois percorre os palpites
// de cada participante e relaciona
// cada palpite à sua partida.
export function buildPredictionAuditRows(
  matches: Match[],
  players: Player[]
): PredictionAuditRow[] {
  // Cria um Map para localizar partidas
  // rapidamente pelo ID.
  //
  // O map interno transforma:
  //
  // [
  //   { id: 'm1', ... },
  //   { id: 'm2', ... }
  // ]
  //
  // em:
  //
  // [
  //   ['m1', partidaM1],
  //   ['m2', partidaM2]
  // ]
  //
  // Depois, new Map transforma isso
  // em uma estrutura de busca por chave.
  const matchesById =
    new Map<string, Match>(
      matches.map(
        (match) => [
          match.id,
          match,
        ]
      )
    );

  // Lista que receberá
  // todas as linhas encontradas.
  const collectedRows:
    PredictionAuditRow[] = [];

  // Percorre todos os participantes.
  players.forEach(
    (player) => {
      // Object.entries transforma
      // o objeto de palpites em uma lista
      // de pares [chave, valor].
      //
      // Exemplo:
      //
      // {
      //   m1: { scoreA: 2, scoreB: 1 },
      //   m2: { scoreA: 0, scoreB: 0 }
      // }
      //
      // vira:
      //
      // [
      //   ['m1', { scoreA: 2, scoreB: 1 }],
      //   ['m2', { scoreA: 0, scoreB: 0 }]
      // ]
      Object.entries(
        player.predictions ?? {}
      ).forEach(
        ([
          matchId,
          prediction,
        ]) => {
          // Procura a partida correspondente
          // ao ID armazenado no palpite.
          const match =
            matchesById.get(
              matchId
            );

          // Caso o palpite aponte para
          // uma partida que não existe mais,
          // essa entrada é ignorada.
          if (!match) {
            return;
          }

          // Adiciona uma nova linha
          // à lista de auditoria.
          collectedRows.push({
            // A combinação deve ser única
            // porque um participante possui
            // apenas um palpite por partida.
            key:
              `${matchId}-${player.id}`,

            match,
            player,
            prediction,
          });
        }
      );
    }
  );

  // Ordena as linhas antes de retorná-las.
  return collectedRows.sort(
    (
      rowA,
      rowB
    ) => {
      // Primeiro, ordena pelo ID da partida.
      if (
        rowA.match.id !==
        rowB.match.id
      ) {
        return rowA.match.id.localeCompare(
          rowB.match.id,
          undefined,
          {
            // numeric: true faz a comparação
            // considerar a parte numérica.
            //
            // Sem numeric:
            // m1, m10, m2
            //
            // Com numeric:
            // m1, m2, m10
            numeric: true,

            // Ignora diferenças entre
            // maiúsculas e minúsculas
            // durante a comparação.
            sensitivity: 'base',
          }
        );
      }

      // Quando duas linhas pertencem
      // à mesma partida,
      // ordena pelo nome do participante.
      return rowA.player.name.localeCompare(
        rowB.player.name
      );
    }
  );
}

// Filtra as linhas de auditoria
// pela partida selecionada.
export function filterAuditRowsByMatch(
  rows: PredictionAuditRow[],
  selectedMatchId: string
): PredictionAuditRow[] {
  // O valor especial "all"
  // representa todas as partidas.
  //
  // Nesse caso, devolve a lista original
  // sem aplicar filtro.
  if (selectedMatchId === 'all') {
    return rows;
  }

  // filter cria uma nova lista
  // contendo apenas as linhas
  // que atendem à condição.
  return rows.filter(
    (row) =>
      row.match.id ===
      selectedMatchId
  );
}

// Divide uma lista em páginas.
//
// O tipo genérico <T> permite
// utilizar a mesma função com
// qualquer tipo de item.
export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number
): PaginatedRows<T> {
  // Quantidade total de itens.
  const totalRows =
    rows.length;

  // Calcula a quantidade de páginas.
  //
  // Math.ceil arredonda para cima.
  //
  // Exemplo:
  //
  // 21 itens / 10 por página = 2,1
  //
  // Math.ceil(2,1) = 3 páginas.
  //
  // Math.max garante pelo menos
  // uma página, mesmo sem resultados.
  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalRows /
        pageSize
      )
    );

  // Garante que a página atual
  // fique dentro de um intervalo válido.
  //
  // Primeiro:
  //
  // Math.max(1, page)
  //
  // impede páginas menores que 1.
  //
  // Depois:
  //
  // Math.min(..., totalPages)
  //
  // impede páginas maiores
  // que a última página.
  const safePage =
    Math.min(
      Math.max(
        1,
        page
      ),
      totalPages
    );

  // Calcula o índice do primeiro item
  // da página atual.
  //
  // Os arrays começam no índice zero.
  //
  // Página 1 com 10 itens:
  //
  // (1 - 1) * 10 = 0
  //
  // Página 2:
  //
  // (2 - 1) * 10 = 10
  const startIndex =
    (safePage - 1) *
    pageSize;

  // Calcula o índice final do recorte.
  //
  // Math.min impede que o índice
  // ultrapasse a quantidade total de itens.
  const endIndex =
    Math.min(
      startIndex + pageSize,
      totalRows
    );

  return {
    // slice cria uma nova lista
    // contendo apenas os itens
    // da página atual.
    //
    // O índice inicial é incluído.
    // O índice final não é incluído.
    rows:
      rows.slice(
        startIndex,
        endIndex
      ),

    page:
      safePage,

    pageSize,

    totalRows,

    totalPages,

    // Quando não existem resultados,
    // exibe zero como início.
    //
    // Caso contrário, soma 1
    // porque o índice do array começa em zero,
    // mas a numeração exibida começa em 1.
    startRow:
      totalRows === 0
        ? 0
        : startIndex + 1,

    endRow:
      endIndex,
  };
}