import {
  AlertTriangle,
  Flame,
  Target,
  TrendingUp,
} from 'lucide-react';

import {
  buildAwards,
  getAwardWinnerText,
} from '../../domain/awards';

import type {
  AwardType,
} from '../../domain/awards';

import type {
  Match,
  Player,
} from '../../types';

// Define os dados que o painel
// recebe do componente pai.
interface AwardsPanelProps {
  // Partidas utilizadas no cálculo
  // das medalhas e destaques.
  matches: Match[];

  // Participantes que serão analisados
  // pela regra de premiações.
  players: Player[];
}

// Relaciona cada tipo de prêmio
// com o ícone que deve aparecer na tela.
//
// Record cria um objeto em que:
//
// chave:
// deve ser um AwardType.
//
// valor:
// deve ser um componente de ícone
// com o mesmo tipo do componente Target.
//
// Exemplo conceitual:
//
// {
//   exact: Target,
//   streak: Flame,
//   errors: AlertTriangle,
//   almost: TrendingUp
// }
const awardIcons:
  Record<
    AwardType,
    typeof Target
  > = {
    // Destaque relacionado
    // a acertos exatos.
    exact: Target,

    // Destaque relacionado
    // a alguma sequência.
    streak: Flame,

    // Destaque relacionado
    // a erros ou "zicadas".
    errors: AlertTriangle,

    // Destaque relacionado
    // a resultados que chegaram perto.
    almost: TrendingUp,
  };

// Painel responsável por exibir
// os destaques atuais do bolão.
//
// Este componente não calcula diretamente
// as estatísticas dos participantes.
//
// Ele envia players e matches
// para buildAwards e apenas renderiza
// o resultado recebido.
export function AwardsPanel({
  matches,
  players,
}: AwardsPanelProps) {
  // Executa a regra de negócio
  // responsável por montar as premiações.
  //
  // O retorno provavelmente é uma lista
  // de objetos com informações como:
  //
  // - type;
  // - title;
  // - description;
  // - valueLabel;
  // - vencedor ou vencedores.
  const awards =
    buildAwards(
      players,
      matches
    );

  // Quando nenhuma medalha puder
  // ser calculada, o componente
  // não renderiza nenhum elemento.
  //
  // Retornar null no React significa:
  //
  // "não mostre nada na tela".
  if (awards.length === 0) {
    return null;
  }

  return (
    // Card principal do painel
    // de medalhas e destaques.
    <section className="app-card app-card-padding">
      {/* Cabeçalho do painel */}
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
          Destaques
        </p>

        <h2 className="text-xl font-black text-slate-950">
          Medalhas do momento
        </h2>

        <p className="text-sm text-slate-500">
          Uma leitura rápida dos acertos, sequências e zicadas do bolão.
        </p>
      </div>

      {/* Grade que contém as medalhas.

          No celular:
          uma coluna.

          Em telas médias:
          duas colunas.

          Em telas maiores:
          quatro colunas. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* map percorre as medalhas
            e transforma cada objeto
            em um card visual. */}
        {awards.map(
          (award) => {
            // Usa o tipo da medalha
            // para encontrar seu ícone.
            //
            // Exemplo:
            //
            // award.type = 'exact'
            //
            // awardIcons['exact']
            //
            // resultado:
            // componente Target.
            const Icon =
              awardIcons[
                award.type
              ];

            return (
              // article representa um conteúdo
              // independente dentro da seção.
              <article
                // O tipo é usado como key
                // porque deve existir apenas
                // uma medalha de cada tipo.
                key={award.type}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                {/* Ícone e valor principal */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-700">
                    {/* Icon é um componente dinâmico.

                        Ele pode representar Target,
                        Flame, AlertTriangle
                        ou TrendingUp, dependendo
                        do tipo da medalha. */}
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Pequeno rótulo com
                      o valor da medalha.

                      Exemplos possíveis:
                      "5 acertos"
                      "3 seguidos"
                      "8 erros"

                      O conteúdo real é produzido
                      pela função buildAwards. */}
                  <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                    {award.valueLabel}
                  </span>
                </div>

                {/* Título da medalha */}
                <h3 className="text-sm font-black text-slate-900">
                  {award.title}
                </h3>

                {/* Explicação do destaque */}
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {award.description}
                </p>

                {/* Nome do vencedor
                    ou texto dos vencedores.

                    getAwardWinnerText recebe
                    a medalha completa e prepara
                    um texto adequado para exibição. */}
                <p className="mt-3 line-clamp-2 text-sm font-bold text-slate-800">
                  {
                    getAwardWinnerText(
                      award
                    )
                  }
                </p>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}