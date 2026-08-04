import {
  Award,
  Coins,
  Trophy,
} from 'lucide-react';

import {
  calculatePrizes,
} from '../../domain/finance';

// Define os dados recebidos
// pelo componente.
interface PrizeSummaryProps {
  // Quantidade de participantes
  // que realmente entraram
  // no cálculo da premiação.
  paidPlayersCount: number;

  // Quantidade total de perfis
  // exibidos no ranking.
  //
  // Esse valor pode ser diferente
  // de paidPlayersCount quando existe
  // algum perfil que não pagou a entrada.
  totalPlayersCount: number;
}

// Exibe um resumo visual
// da premiação do bolão.
//
// O componente mostra:
//
// - quantidade de participantes pagantes;
// - valor total arrecadado;
// - prêmio do primeiro lugar;
// - prêmio do segundo lugar;
// - quantidade total de perfis no ranking.
export function PrizeSummary({
  paidPlayersCount,
  totalPlayersCount,
}: PrizeSummaryProps) {
  // calculatePrizes executa
  // a regra financeira do bolão.
  //
  // O componente informa quantos
  // participantes pagaram.
  //
  // A função retorna um objeto
  // contendo os valores calculados.
  const {
    totalPrizePool,
    firstPrize,
    secondPrize,
  } = calculatePrizes(
    paidPlayersCount
  );

  // Verifica se a quantidade
  // de participantes pagantes
  // é diferente da quantidade
  // total de perfis no ranking.
  //
  // Essa variável será usada
  // para decidir qual texto mostrar.
  const hasUnpaidPlayers =
    totalPlayersCount !==
    paidPlayersCount;

  return (
    // Card principal do resumo
    // da premiação.
    <section className="app-card app-card-padding">
      {/* No celular, o conteúdo
          fica dividido verticalmente.

          A partir do breakpoint md,
          o resumo e os prêmios
          ficam lado a lado. */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Informações gerais
            sobre a premiação */}
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-700">
            <Coins className="h-4 w-4" />

            <span>
              Bolão ativo - Entrada R$ 10,00
            </span>
          </div>

          {/* Valor total calculado
              pela função calculatePrizes.

              toFixed(2) garante
              duas casas decimais.

              Exemplo:

              150
              vira
              150.00 */}
          <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900 md:text-3xl">
            Prêmio total: R$ {totalPrizePool.toFixed(2)}
          </h2>

          {/* Explica quantos participantes
              foram considerados no cálculo. */}
          <p className="mt-1 text-xs text-slate-500">
            Baseado em{' '}
            {paidPlayersCount}{' '}
            participantes pagantes

            {/* Quando a quantidade de perfis
                for diferente da quantidade
                de pagantes, também mostra
                o total de pessoas no ranking. */}
            {hasUnpaidPlayers
              ? (
                  ` (${totalPlayersCount} perfis no ranking).`
                )
              : (
                  '.'
                )}
          </p>
        </div>

        {/* Cards dos dois prêmios.

            No celular:
            uma coluna.

            A partir do breakpoint sm:
            duas colunas. */}
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto">
          {/* Prêmio do primeiro lugar */}
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            {/* Ícone do primeiro lugar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Trophy className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
                1º lugar - 80%
              </p>

              {/* Valor destinado
                  ao primeiro colocado */}
              <p className="text-xl font-black text-amber-700">
                R$ {firstPrize.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Prêmio do segundo lugar */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            {/* Ícone do segundo lugar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
              <Award className="h-5 w-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                2º lugar - 20%
              </p>

              {/* Valor destinado
                  ao segundo colocado */}
              <p className="text-xl font-black text-slate-800">
                R$ {secondPrize.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}