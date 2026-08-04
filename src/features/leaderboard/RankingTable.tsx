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

// Define os dados que a tabela
// recebe do componente pai.
interface RankingTableProps {
  // Quantidade de participantes pagantes.
  //
  // Esse número é utilizado para calcular
  // o valor total da premiação.
  paidPlayersCount: number;

  // Lista dos jogadores já ordenada
  // pela pontuação do ranking.
  //
  // A posição de cada jogador no array
  // representa sua posição geral.
  players: Player[];
}

// Monta o texto da premiação
// de acordo com a posição do participante
// entre os jogadores que realmente concorrem.
//
// paidRank:
//
// 1:
// primeiro colocado entre os pagantes.
//
// 2:
// segundo colocado entre os pagantes.
//
// null ou demais posições:
// não mostra texto de premiação.
function getPrizeText(
  paidRank: number | null,
  paidPlayersCount: number
): string | null {
  // Calcula o valor total arrecadado
  // utilizando somente a quantidade
  // de participantes pagantes.
  const totalPrizePool =
    calculatePrizePool(
      paidPlayersCount
    );

  // Primeiro lugar entre
  // os participantes elegíveis.
  if (paidRank === 1) {
    const firstPrize =
      totalPrizePool *
      FIRST_PLACE_PERCENTAGE;

    return (
      'Zona de premiação - R$ ' +
      firstPrize.toFixed(2)
    );
  }

  // Segundo lugar entre
  // os participantes elegíveis.
  if (paidRank === 2) {
    const secondPrize =
      totalPrizePool *
      SECOND_PLACE_PERCENTAGE;

    return (
      'Zona de premiação - R$ ' +
      secondPrize.toFixed(2)
    );
  }

  // Os demais participantes
  // não exibem texto de prêmio.
  return null;
}

// Tabela do ranking utilizada
// em telas médias e grandes.
//
// No celular, essa tabela fica escondida
// e o RankingMobileList assume a exibição.
export function RankingTable({
  paidPlayersCount,
  players,
}: RankingTableProps) {
  return (
    // hidden:
    // fica escondido em telas pequenas.
    //
    // md:block:
    // aparece a partir do breakpoint md.
    //
    // overflow-x-auto:
    // permite rolagem horizontal
    // caso a tabela ultrapasse a tela.
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-left">
        {/* Cabeçalho da tabela */}
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
            <th className="w-16 px-6 py-4 text-center font-bold">
              Pos
            </th>

            <th className="px-4 py-4 font-bold">
              Participante
            </th>

            <th className="w-24 px-4 py-4 text-center font-bold">
              Exatos
            </th>

            <th className="w-24 px-4 py-4 text-center font-bold">
              Parciais
            </th>

            <th className="w-24 px-4 py-4 text-center font-bold">
              Erros
            </th>

            <th className="w-28 px-6 py-4 text-right font-bold">
              Pontos
            </th>
          </tr>
        </thead>

        {/* Corpo da tabela */}
        <tbody className="divide-y divide-slate-100">
          {/* map percorre a lista de jogadores
              e transforma cada jogador
              em uma linha da tabela. */}
          {players.map(
            (
              player,
              index
            ) => {
              // Arrays começam no índice zero.
              //
              // Primeiro item:
              // index = 0
              // rank = 1
              //
              // Segundo item:
              // index = 1
              // rank = 2
              const rank =
                index + 1;

              // Verifica se o jogador ocupa
              // a primeira posição geral.
              const isFirst =
                rank === 1;

              // Verifica se ocupa
              // a segunda posição geral.
              const isSecond =
                rank === 2;

              // Verifica se esse perfil
              // representa o administrador.
              const isAdmin =
                isAdminPlayer(
                  player
                );

              // Calcula a posição do jogador
              // considerando somente participantes
              // que concorrem à premiação.
              //
              // Essa posição pode ser diferente
              // da posição geral do ranking.
              const paidRank =
                getPaidRank(
                  players,
                  index
                );

              // Prepara o texto do possível prêmio.
              const prizeText =
                getPrizeText(
                  paidRank,
                  paidPlayersCount
                );

              // Prepara o texto do ajuste manual.
              //
              // Exemplo:
              //
              // "Ajuste manual: +3 pts"
              //
              // Quando não existe ajuste,
              // a função retorna uma string vazia.
              const manualAdjustmentText =
                getManualAdjustmentText(
                  player
                );

              // Define a aparência da linha
              // conforme a posição geral.
              //
              // Primeiro lugar:
              // fundo amarelo.
              //
              // Segundo lugar:
              // fundo cinza.
              //
              // Demais:
              // fundo normal com destaque no hover.
              let rowClassName =
                'transition-colors hover:bg-slate-50/40';

              if (isFirst) {
                rowClassName =
                  'bg-amber-50 transition-colors hover:bg-amber-100/40';
              } else if (isSecond) {
                rowClassName =
                  'bg-slate-50 transition-colors hover:bg-slate-100/50';
              }

              return (
                // motion.tr é uma versão animada
                // do elemento HTML <tr>.
                //
                // Ele continua funcionando
                // como uma linha de tabela,
                // mas também aceita propriedades
                // da biblioteca Motion.
                <motion.tr
                  key={player.id}

                  // Identifica a linha desse jogador
                  // durante mudanças no ranking.
                  //
                  // Quando a posição muda,
                  // a biblioteca reconhece
                  // que é o mesmo participante
                  // e anima o deslocamento.
                  layoutId={
                    `player-row-${player.id}`
                  }

                  // Configuração da animação
                  // no estilo mola.
                  //
                  // stiffness:
                  // rigidez ou velocidade da mola.
                  //
                  // damping:
                  // reduz a oscilação.
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                  }}

                  className={
                    rowClassName
                  }
                >
                  {/* Coluna da posição */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      {isFirst
                        ? (
                            // Primeiro lugar geral:
                            // mostra o troféu.
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-white shadow-sm"
                              title="1º lugar"
                            >
                              <Trophy className="h-4 w-4" />
                            </div>
                          )
                        : isSecond
                          ? (
                              // Segundo lugar geral:
                              // mostra a medalha.
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-400 text-white shadow-sm"
                                title="2º lugar"
                              >
                                <Award className="h-4 w-4" />
                              </div>
                            )
                          : (
                              // Demais posições:
                              // mostra o número.
                              <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-500">
                                {rank}º
                              </span>
                            )}
                    </div>
                  </td>

                  {/* Coluna do participante */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar do jogador.
                          
                          Quando o avatar estiver vazio,
                          mostra uma bola como padrão. */}
                      <span className="flex h-10 w-10 min-w-[40px] select-none items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-2xl">
                        {player.avatar || '⚽'}
                      </span>

                      <div>
                        {/* Nome e identificação de admin */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-800">
                            {player.name}
                          </span>

                          {/* Exibido somente
                              para o administrador. */}
                          {isAdmin && (
                            <span className="rounded border border-red-100 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-600">
                              ADM
                            </span>
                          )}
                        </div>

                        {/* Esta parte possui
                            três possibilidades:

                            1. Admin:
                               informa que não concorre.

                            2. Participante premiado:
                               mostra o valor do prêmio.

                            3. Demais participantes:
                               não mostra nada. */}
                        {isAdmin
                          ? (
                              <span className="text-[10px] font-semibold text-red-500">
                                Não entra na premiação
                              </span>
                            )
                          : prizeText
                            ? (
                                <span
                                  className={
                                    `text-[10px] font-semibold ${
                                      isFirst
                                        ? 'text-amber-600'
                                        : 'text-slate-600'
                                    }`
                                  }
                                >
                                  {prizeText}
                                </span>
                              )
                            : null}

                        {/* Exibe o ajuste manual
                            quando ele existe. */}
                        {manualAdjustmentText && (
                          <span className="block text-[10px] font-semibold text-blue-600">
                            {manualAdjustmentText}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Quantidade de acertos exatos */}
                  <td className="px-4 py-4 text-center font-mono text-sm font-bold text-emerald-600">
                    {player.exactHits}
                  </td>

                  {/* Quantidade de acertos parciais */}
                  <td className="px-4 py-4 text-center font-mono text-sm font-medium text-blue-600">
                    {player.partialHits}
                  </td>

                  {/* Quantidade de erros */}
                  <td className="px-4 py-4 text-center font-mono text-sm text-slate-400">
                    {player.errorHits}
                  </td>

                  {/* Pontuação total */}
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-slate-800">
                      {player.points}{' '}

                      <span className="text-xs font-semibold text-slate-400">
                        pts
                      </span>
                    </span>
                  </td>
                </motion.tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}