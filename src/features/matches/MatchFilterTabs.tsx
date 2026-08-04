import {
  getMatchFilterCounts,
} from '../../domain/matchFilters';

import type {
  Match,
  Player,
} from '../../types';

import type {
  MatchFilter,
} from './types';

// Define somente as informações fixas
// de cada filtro.
//
// As contagens não ficam aqui,
// porque mudam de acordo com:
//
// - partidas;
// - jogador;
// - palpites;
// - horário atual.
const FILTER_DEFINITIONS: ReadonlyArray<{
  id: MatchFilter;
  label: string;
}> = [
  {
    id: 'open',
    label: 'Abertos',
  },
  {
    id: 'missing',
    label: 'Sem palpite',
  },
  {
    id: 'predicted',
    label: 'Meus palpites',
  },
  {
    id: 'locked',
    label: 'Travados',
  },
  {
    id: 'finished',
    label: 'Finalizados',
  },
  {
    id: 'all',
    label: 'Todos',
  },
];

// Define os dados e a ação
// recebidos do componente pai.
interface MatchFilterTabsProps {
  // Todas as partidas utilizadas
  // para calcular as contagens.
  matches: Match[];

  // Participante atual.
//
// Os palpites dele são usados
// para descobrir, por exemplo:
//
// - quais jogos possuem palpite;
// - quais estão sem palpite.
  userPlayer: Player;

  // Filtro atualmente selecionado.
  activeFilter: MatchFilter;

  // Comunica ao componente pai
  // que o usuário selecionou
  // outro filtro.
  onChangeFilter: (
    filter: MatchFilter
  ) => void;
}

// Mostra os filtros utilizados
// na listagem de partidas.
//
// Este componente:
//
// - calcula as contagens;
// - mostra os botões;
// - identifica o filtro ativo;
// - comunica o clique.
//
// Ele não filtra diretamente
// a lista de partidas.
//
// A filtragem real provavelmente
// acontece no componente pai
// ou em uma função do domínio.
export function MatchFilterTabs({
  matches,
  userPlayer,
  activeFilter,
  onChangeFilter,
}: MatchFilterTabsProps) {
  // Calcula quantas partidas pertencem
  // a cada categoria.
  //
  // A regra permanece centralizada
  // em domain/matchFilters.
  const counts =
    getMatchFilterCounts(
      matches,
      userPlayer
    );

  return (
    // Grupo visual dos filtros.
    //
    // flex-wrap permite que os botões
    // quebrem para outra linha
    // quando não houver espaço.
    <div
      role="group"
      aria-label="Filtrar partidas"
      className="flex w-full flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
    >
      {/* Percorre as definições fixas
          e cria um botão para cada filtro. */}
      {FILTER_DEFINITIONS.map(
        (item) => {
          // Verifica se este botão
          // representa o filtro atual.
          const isActive =
            activeFilter ===
            item.id;

          // Busca a contagem usando
          // o próprio ID do filtro.
          //
          // Exemplo:
          //
          // item.id = 'missing'
          //
          // counts[item.id]
          //
          // equivale a:
          //
          // counts.missing
          const count =
            counts[item.id];

          // Separa a classe visual
          // do estado selecionado.
          const stateClassName =
            isActive
              ? (
                  'bg-white ' +
                  'text-slate-900 ' +
                  'shadow-sm'
                )
              : (
                  'text-slate-500 ' +
                  'hover:text-slate-800'
                );

          return (
            <button
              key={item.id}
              type="button"

              // Comunica ao componente pai
              // qual filtro foi escolhido.
              onClick={
                () =>
                  onChangeFilter(
                    item.id
                  )
              }

              // Indica semanticamente
              // se o botão está selecionado.
              aria-pressed={isActive}

              className={
                `flex-1 whitespace-nowrap rounded-md ` +
                `px-3 py-2 text-xs font-bold transition ` +
                `sm:flex-initial ${stateClassName}`
              }
            >
              {item.label}
              {' ('}
              {count}
              {')'}
            </button>
          );
        }
      )}
    </div>
  );
}