import {
  Award,
  Trophy,
} from 'lucide-react';

import {
  motion,
} from 'motion/react';

import {
  calculatePrizePool,
  FIRST_PLACE_PERCENTAGE,
  getPaidRank,
  isAdminPlayer,
  SECOND_PLACE_PERCENTAGE,
} from '../../domain/finance';

import type {
  Player,
} from '../../types';

import {
  getManualAdjustmentText,
} from './manualAdjustment';

// Define os dados recebidos
// pela lista mobile do ranking.
interface RankingMobileListProps {
  // Quantidade de participantes
  // considerados pagantes.
//
// Esse valor é utilizado
// para calcular a premiação.
  paidPlayersCount: number;

  // Lista de jogadores já ordenada
  // pela classificação.
//
// Este componente não ordena os jogadores.
// Ele considera que a posição no array
// já representa a posição no ranking.
  players: Player[];
}

// Retorna o texto da premiação
// de acordo com a posição entre
// os participantes pagantes.
//
// paidRank:
//
// 1:
// primeiro participante elegível.
//
// 2:
// segundo participante elegível.
//
// null ou outras posições:
// não recebem texto de prêmio.
function getPrizeText(
  paidRank: number | null,
  paidPlayersCount: number
): string | null {
  // Calcula o valor total arrecadado
  // considerando apenas os pagantes.
  const totalPrizePool =
    calculatePrizePool(
      paidPlayersCount
    );

  // Primeiro colocado entre
  // os participantes pagantes.
  if (paidRank === 1) {
    const firstPrize =
      totalPrizePool *
      FIRST_PLACE_PERCENTAGE;

    return (
      `Prêmio: R$ ` +
      `${firstPrize.toFixed(2)}`
    );
  }

  // Segundo colocado entre
  // os participantes pagantes.
  if (paidRank === 2) {
    const secondPrize =
      totalPrizePool *
      SECOND_PLACE_PERCENTAGE;

    return (
      `Prêmio: R$ ` +
      `${secondPrize.toFixed(2)}`
    );
  }

  // Demais posições não exibem prêmio.
  return null;
}

// Lista mobile da classificação.
//
// Ela só aparece em telas pequenas,
// pois utiliza a classe md:hidden.
//
// Em telas maiores, provavelmente existe
// outra tabela ou componente específico.
export function RankingMobileList({
  paidPlayersCount,
  players,
}: RankingMobileListProps) {
  return (
    // md:hidden significa:
    //
    // aparece em telas pequenas;
    // fica escondido a partir do breakpoint md.
    //
    // divide-y adiciona uma divisão horizontal
    // entre os cards dos jogadores.
    <div className="divide-y divide-slate-100 md:hidden">
      {/* map percorre a lista de jogadores
          e transforma cada jogador
          em um card do ranking. */}
      {players.map(
        (
          player,
          index
        ) => {
          // Arrays começam no índice zero.
          //
          // Primeiro jogador:
          // index = 0
          // rank = 1
          //
          // Segundo jogador:
          // index = 1
          // rank = 2
          const rank =
            index + 1;

          // Verifica a posição geral
          // dentro da lista recebida.
          const isFirst =
            rank === 1;

          const isSecond =
            rank === 2;

          // Verifica se este jogador
          // representa o perfil administrativo.
          const isAdmin =
            isAdminPlayer(
              player
            );

          // Descobre a posição do jogador
          // considerando somente participantes
          // elegíveis para a premiação.
          //
          // Essa posição pode ser diferente
          // da posição geral do ranking.
          const paidRank =
            getPaidRank(
              players,
              index
            );

          // Monta o texto do prêmio,
          // caso o jogador seja o primeiro
          // ou segundo participante pagante.
          const prizeText =
            getPrizeText(
              paidRank,
              paidPlayersCount
            );

          // Prepara o texto do ajuste manual,
          // como:
//
// "Ajuste manual: +3 pts"
//
// Quando não existe ajuste,
// a função retorna uma string vazia.
          const manualAdjustmentText =
            getManualAdjustmentText(
              player
            );

          // Define o fundo do card
          // de acordo com a posição geral.
//
// Primeiro lugar:
// fundo amarelo.
//
// Segundo lugar:
// fundo cinza.
//
// Demais posições:
// fundo branco.
          let cardBackgroundClass =
            'bg-white';

          if (isFirst) {
            cardBackgroundClass =
              'bg-amber-50';
          } else if (isSecond) {
            cardBackgroundClass =
              'bg-slate-50';
          }

          return (
            // motion.article é uma versão animada
            // do elemento HTML <article>.
            //
            // Ele aceita as propriedades normais
            // de um article e também propriedades
            // de animação da biblioteca Motion.
            <motion.article
              key={player.id}

              // layoutId identifica visualmente
              // este jogador durante mudanças
              // de posição no ranking.
              //
              // Como cada jogador possui um ID único,
              // a biblioteca consegue reconhecer
              // o mesmo card antes e depois
              // da reordenação.
              layoutId={
                `player-mobile-card-${player.id}`
              }

              // Configura a animação
              // como uma mola.
              //
              // stiffness:
              // intensidade ou rigidez da mola.
              //
              // damping:
              // reduz a oscilação da animação.
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 30,
              }}

              className={
                `p-4 ${cardBackgroundClass}`
              }
            >
              {/* Parte superior do card:
                  posição, jogador e pontos */}
              <div className="flex items-start justify-between gap-3">
                {/* Lado esquerdo:
                    posição e dados do jogador */}
                <div className="flex min-w-0 items-start gap-3">
                  {/* Indicador visual da posição */}
                  <div className="shrink-0">
                    {isFirst
                      ? (
                          // Primeiro lugar geral:
                          // mostra um troféu.
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-white shadow-sm">
                            <Trophy className="h-4 w-4" />
                          </div>
                        )
                      : isSecond
                        ? (
                            // Segundo lugar geral:
                            // mostra uma medalha.
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-400 text-white shadow-sm">
                              <Award className="h-4 w-4" />
                            </div>
                          )
                        : (
                            // Demais posições:
                            // mostra o número do ranking.
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                              {rank}º
                            </div>
                          )}
                  </div>

                  {/* Nome, avatar e informações extras */}
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Caso o jogador não tenha avatar,
                          utiliza uma bola como padrão. */}
                      <span className="shrink-0 text-xl">
                        {player.avatar || '⚽'}
                      </span>

                      {/* truncate corta nomes muito longos
                          quando não existe espaço suficiente. */}
                      <h3 className="truncate text-sm font-bold text-slate-900">
                        {player.name}
                      </h3>

                      {/* Identificação visual
                          exibida somente para admin. */}
                      {isAdmin && (
                        <span className="shrink-0 rounded border border-red-100 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">
                          ADM
                        </span>
                      )}
                    </div>

                    {/* O texto abaixo possui
                        três possibilidades:
//
// 1. Admin:
//    mostra que não participa da premiação.
//
// 2. Participante premiado:
//    mostra o valor do prêmio.
//
// 3. Demais participantes:
//    não mostra nenhum texto. */}
                    {isAdmin
                      ? (
                          <p className="mt-0.5 text-[11px] font-semibold text-red-500">
                            Não entra na premiação
                          </p>
                        )
                      : prizeText
                        ? (
                            <p
                              className={
                                `mt-0.5 text-[11px] font-semibold ${
                                  isFirst
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                                }`
                              }
                            >
                              {prizeText}
                            </p>
                          )
                        : null}

                    {/* Mostra o ajuste manual
                        somente quando existe texto. */}
                    {manualAdjustmentText && (
                      <p className="mt-0.5 text-[11px] font-semibold text-blue-600">
                        {manualAdjustmentText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pontuação total do jogador */}
                <div className="shrink-0 text-right">
                  <p className="text-xl font-black leading-none text-slate-900">
                    {player.points}
                  </p>

                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    pts
                  </p>
                </div>
              </div>

              {/* Resumo dos resultados
                  do participante */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {/* Acertos exatos */}
                <div className="rounded-lg border border-slate-200 bg-white/80 p-2 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Exatos
                  </p>

                  <p className="text-sm font-black text-emerald-600">
                    {player.exactHits}
                  </p>
                </div>

                {/* Acertos parciais */}
                <div className="rounded-lg border border-slate-200 bg-white/80 p-2 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Parciais
                  </p>

                  <p className="text-sm font-black text-blue-600">
                    {player.partialHits}
                  </p>
                </div>

                {/* Palpites errados */}
                <div className="rounded-lg border border-slate-200 bg-white/80 p-2 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Erros
                  </p>

                  <p className="text-sm font-black text-slate-500">
                    {player.errorHits}
                  </p>
                </div>
              </div>
            </motion.article>
          );
        }
      )}
    </div>
  );
}