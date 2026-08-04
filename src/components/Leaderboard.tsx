import {
  TrendingUp,
} from 'lucide-react';

import {
  AwardsPanel,
} from '../features/leaderboard/AwardsPanel';

import {
  PredictionsAuditTable,
} from '../features/leaderboard/PredictionsAuditTable';

import {
  PrizeSummary,
} from '../features/leaderboard/PrizeSummary';

import {
  RankingMobileList,
} from '../features/leaderboard/RankingMobileList';

import {
  RankingTable,
} from '../features/leaderboard/RankingTable';

import type {
  Match,
  Player,
} from '../types';

// Dados necessários para montar
// a página de classificação.
interface LeaderboardProps {
  // Partidas usadas por componentes
  // como awards e auditoria.
  matches: Match[];

  // Jogadores exibidos no ranking.
  //
  // Este componente pressupõe que
  // o array já está preparado
  // na ordem correta de classificação.
  players: Player[];

  // Quantidade de participantes
  // que efetivamente entram
  // no cálculo financeiro dos prêmios.
  paidPlayersCount: number;
}

// Organiza as seções relacionadas
// à classificação do bolão.
//
// Este componente:
//
// - mostra o resumo dos prêmios;
// - mostra conquistas especiais;
// - apresenta o ranking;
// - apresenta a auditoria.
//
// Ele não calcula diretamente:
//
// - pontos;
// - ordem dos jogadores;
// - prêmios;
// - acertos;
// - palpites.
export function Leaderboard({
  matches,
  players,
  paidPlayersCount,
}: LeaderboardProps) {
  // Evita repetir a comparação
  // players.length === 0 no JSX.
  const hasPlayers =
    players.length > 0;

  // Corrige singular e plural
  // no contador do cabeçalho.
  const playersCountLabel =
    players.length === 1
      ? '1 jogador'
      : `${players.length} jogadores`;

  return (
    <div
      id="leaderboard-section"
      className="space-y-6"
    >
      {/* Resumo financeiro
          da premiação.

          O total de jogadores
          e o total de pagantes
          podem ser diferentes. */}
      <PrizeSummary
        paidPlayersCount={
          paidPlayersCount
        }
        totalPlayersCount={
          players.length
        }
      />

      {/* Prêmios e destaques
          derivados das partidas
          e dos jogadores. */}
      <AwardsPanel
        matches={matches}
        players={players}
      />

      {/* Área principal do ranking */}
      <section
        id="ranking-container"
        className="app-card overflow-hidden"
        aria-labelledby="ranking-title"
      >
        {/* Cabeçalho da classificação */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4 md:p-5">
          <div className="flex min-w-0 items-center gap-2">
            <TrendingUp
              className="h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden="true"
            />

            <div>
              <h3
                id="ranking-title"
                className="text-base font-bold uppercase tracking-tight text-slate-800"
              >
                Classificação geral
              </h3>

              <p className="text-xs text-slate-500">
                Ranking atualizado conforme os resultados lançados.
              </p>
            </div>
          </div>

          {/* Quantidade total de jogadores
              presentes na classificação. */}
          <span className="shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700">
            {playersCountLabel}
          </span>
        </div>

        {/* Sem participantes:
            mostra uma explicação
            em vez das tabelas. */}
        {!hasPlayers ? (
          <div className="p-6 text-sm text-slate-600">
            Nenhum participante cadastrado ainda. Quando as pessoas entrarem
            com Google ou forem adicionadas pelo admin, o ranking aparecerá
            aqui.
          </div>
        ) : (
          <>
            {/* Visualização para celular.

                Embora fique escondida
                em telas grandes pelo CSS,
                ela continua montada no React. */}
            <RankingMobileList
              paidPlayersCount={
                paidPlayersCount
              }
              players={players}
            />

            {/* Visualização em tabela
                para telas maiores. */}
            <RankingTable
              paidPlayersCount={
                paidPlayersCount
              }
              players={players}
            />
          </>
        )}
      </section>

      {/* Conferência detalhada
          dos palpites dos participantes.

          PENDÊNCIA DE CONTEXTO:
          confirmar se essa auditoria
          deve ser visível para todos
          ou somente para administradores. */}
      <PredictionsAuditTable
        matches={matches}
        players={players}
      />
    </div>
  );
}