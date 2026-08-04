import {
  useMemo,
} from 'react';

import {
  BarChart3,
  Target,
  Users,
  X,
} from 'lucide-react';

import {
  getMatchGroupLabel,
} from '../../domain/matchLabels';

import {
  buildMatchStats,
} from '../../domain/matchStats';

import type {
  Match,
  Player,
} from '../../types';

import {
  TeamBadge,
} from './TeamBadge';

// Define os dados e ações
// que o modal recebe do componente pai.
interface MatchDetailsModalProps {
  // Partida cujos detalhes
  // serão apresentados.
  match: Match;

  // Lista de jogadores utilizada
  // para calcular as estatísticas
  // dos palpites dessa partida.
  players: Player[];

  // Função que solicita
  // o fechamento do modal.
  //
  // O próprio modal não controla
  // se está aberto ou fechado.
  onClose: () => void;
}

// Prepara uma lista de nomes
// para ser exibida sem deixar
// o card excessivamente grande.
function formatNames(
  names: string[]
): string {
  // Quando a lista está vazia,
  // mostra uma mensagem amigável.
  if (names.length === 0) {
    return 'Ninguém ainda.';
  }

  // Listas com até seis nomes
  // são exibidas por completo.
  if (names.length <= 6) {
    return names.join(', ');
  }

  // Quando existem mais de seis nomes,
  // mostra somente os primeiros seis
  // e informa quantos ficaram ocultos.
  //
  // Exemplo:
  //
  // 8 nomes
  // ↓
  // mostra 6
  // ↓
  // "e mais 2"
  const visibleNames =
    names
      .slice(0, 6)
      .join(', ');

  const remainingNamesCount =
    names.length - 6;

  return (
    `${visibleNames} ` +
    `e mais ${remainingNamesCount}`
  );
}

// Prepara o texto do resultado oficial.
//
// Quando a partida está finalizada
// e possui os dois placares,
// retorna algo como:
//
// "2 x 1"
//
// Caso contrário:
//
// "Em aberto"
function getResultLabel(
  match: Match
): string {
  if (
    match.status === 'finished' &&
    typeof match.scoreA === 'number' &&
    typeof match.scoreB === 'number'
  ) {
    return (
      `${match.scoreA} x ` +
      `${match.scoreB}`
    );
  }

  return 'Em aberto';
}

// Modal responsável por apresentar
// informações detalhadas de uma partida.
//
// Ele mostra:
//
// - data, horário e local;
// - quantidade de palpites;
// - tendências de vitória e empate;
// - placares mais escolhidos;
// - resultado oficial;
// - jogadores com acertos e erros.
export function MatchDetailsModal({
  match,
  players,
  onClose,
}: MatchDetailsModalProps) {
  // Calcula as estatísticas da partida.
  //
  // useMemo reaproveita o resultado
  // enquanto as referências de match
  // e players não forem alteradas.
  const stats =
    useMemo(
      () =>
        buildMatchStats(
          match,
          players
        ),

      [
        match,
        players,
      ]
    );

  // ID usado para relacionar
  // o modal ao seu título.
  const modalTitleId =
    `match-details-title-${match.id}`;

  return (
    // Camada que cobre toda a tela.
    //
    // fixed inset-0:
    // ocupa toda a área visível.
    //
    // z-[90]:
    // coloca o modal acima
    // dos demais elementos.
    //
    // bg-slate-950/60:
    // cria o fundo escurecido.
    //
    // backdrop-blur-sm:
    // desfoca levemente
    // o conteúdo atrás do modal.
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      {/* Caixa principal do modal.

          role="dialog":
          informa às tecnologias assistivas
          que este elemento é uma janela.

          aria-modal="true":
          informa que o conteúdo externo
          não deve ser considerado ativo.

          aria-labelledby:
          associa o modal ao título. */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Cabeçalho do modal */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
                Detalhes do jogo
              </p>

              {/* Times da partida */}
              <div className="mt-2 flex items-center gap-3">
                <TeamBadge
                  flag={match.flagA}
                  logo={match.logoA}
                  name={match.teamA}
                />

                <h2
                  id={modalTitleId}
                  className="min-w-0 text-lg font-black text-slate-950"
                >
                  {match.teamA}
                  {' x '}
                  {match.teamB}
                </h2>

                <TeamBadge
                  flag={match.flagB}
                  logo={match.logoB}
                  name={match.teamB}
                />
              </div>

              {/* Fase, data, horário
                  e estádio opcional */}
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {getMatchGroupLabel(
                  match.group
                )}

                {' • '}

                {match.date}

                {' às '}

                {match.time}

                {match.venue
                  ? ` • ${match.venue}`
                  : ''}
              </p>
            </div>

            {/* Botão que solicita
                o fechamento do modal */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              title="Fechar"
              aria-label="Fechar detalhes do jogo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Conteúdo com rolagem própria.

            max-h-[75vh]:
            limita a altura a 75%
            da área visível.

            overflow-y-auto:
            adiciona rolagem vertical
            quando necessário. */}
        <div className="max-h-[75vh] overflow-y-auto p-5">
          {/* Resumo numérico dos palpites */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {/* Total de palpites */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Palpites
              </p>

              <p className="mt-1 text-xl font-black text-slate-900">
                {stats.totalPredictions}
              </p>
            </div>

            {/* Palpites de vitória do time A */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {match.teamA} vence
              </p>

              <p className="mt-1 text-xl font-black text-slate-900">
                {stats.teamAWins}
              </p>
            </div>

            {/* Palpites de empate */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Empate
              </p>

              <p className="mt-1 text-xl font-black text-slate-900">
                {stats.draws}
              </p>
            </div>

            {/* Palpites de vitória do time B */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                {match.teamB} vence
              </p>

              <p className="mt-1 text-xl font-black text-slate-900">
                {stats.teamBWins}
              </p>
            </div>
          </div>

          {/* Estatísticas detalhadas */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* COLUNA 1:
                placares mais escolhidos */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-700" />

                <h3 className="text-sm font-black text-slate-900">
                  Placares mais escolhidos
                </h3>
              </div>

              {/* Quando não existem palpites,
                  mostra um estado vazio. */}
              {stats.topScores.length === 0
                ? (
                    <p className="text-sm font-semibold text-slate-500">
                      Ninguém palpitou nesse jogo ainda.
                    </p>
                  )
                : (
                    <div className="space-y-2">
                      {/* Transforma cada placar
                          em um pequeno card. */}
                      {stats.topScores.map(
                        (score) => (
                          <div
                            key={score.scoreLabel}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* Placar escolhido */}
                              <span className="font-mono text-sm font-black text-slate-900">
                                {score.scoreLabel}
                              </span>

                              {/* Quantidade de pessoas.

                                  O texto muda entre
                                  singular e plural. */}
                              <span className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                                {score.count}{' '}

                                {score.count === 1
                                  ? 'pessoa'
                                  : 'pessoas'}
                              </span>
                            </div>

                            {/* Nomes de quem escolheu
                                esse placar */}
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {formatNames(
                                score.playerNames
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
            </div>

            {/* COLUNA 2:
                resultado e pontuação */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-700" />

                <h3 className="text-sm font-black text-slate-900">
                  Resultado e pontuação
                </h3>
              </div>

              {/* Resultado oficial */}
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                  Resultado oficial
                </p>

                <p className="mt-1 font-mono text-lg font-black text-slate-900">
                  {getResultLabel(match)}
                </p>
              </div>

              {/* Quando a partida estiver finalizada,
                  mostra os jogadores separados
                  por tipo de resultado. */}
              {match.status === 'finished'
                ? (
                    <div className="mt-3 space-y-2">
                      {/* Acertos exatos */}
                      <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">
                          Exatos
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {formatNames(
                            stats.exactPlayers
                          )}
                        </p>
                      </div>

                      {/* Acertos parciais */}
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                          Parciais
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {formatNames(
                            stats.partialPlayers
                          )}
                        </p>
                      </div>

                      {/* Palpites errados */}
                      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-red-700">
                          Deu ruim
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-800">
                          {formatNames(
                            stats.errorPlayers
                          )}
                        </p>
                      </div>
                    </div>
                  )
                : (
                    // Enquanto a partida não terminar,
                    // explica o que aparecerá
                    // futuramente nesta área.
                    <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                        <p className="text-xs font-semibold leading-relaxed text-slate-500">
                          Quando o jogo finalizar, esta área mostra quem acertou
                          exato, quem fez parcial e quem foi de base.
                        </p>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}