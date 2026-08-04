import {
  BadgeDollarSign,
  CalendarDays,
  Home,
  Shield,
  Trophy,
} from 'lucide-react';

import type {
  AppTab,
} from '../../types';

// Representa uma opção
// da navegação principal.
interface NavigationItem {
  // Identificador usado para decidir
  // qual seção da aplicação está ativa.
  id: AppTab;

  // Texto completo usado
  // na navegação desktop.
  label: string;

  // Texto reduzido usado
  // na navegação mobile.
  shortLabel: string;

  // Componente de ícone
  // associado à opção.
  icon: typeof Home;
}

// Itens disponíveis para todos
// os usuários da aplicação.
//
// A configuração fica fora do componente
// porque não depende das props
// nem muda durante a execução.
const BASE_ITEMS: ReadonlyArray<NavigationItem> = [
  {
    id: 'home',
    label: 'Início & Regras',
    shortLabel: 'Início',
    icon: Home,
  },
  {
    id: 'matches',
    label: 'Meus Palpites',
    shortLabel: 'Palpites',
    icon: CalendarDays,
  },
  {
    id: 'ranking',
    label: 'Classificação',
    shortLabel: 'Ranking',
    icon: Trophy,
  },
];

// Opção disponível somente
// para administradores.
//
// Não utilizamos:
//
// 'admin' as AppTab
//
// porque queremos que o TypeScript
// confirme naturalmente que "admin"
// pertence ao tipo AppTab.
const ADMIN_ITEM: NavigationItem = {
  id: 'admin',
  label: 'Painel ADM',
  shortLabel: 'ADM',
  icon: Shield,
};

// Dados e ação recebidos
// pelo componente.
interface AppNavigationProps {
  // Seção atualmente selecionada.
  activeTab: AppTab;

  // Define se a opção administrativa
  // deve aparecer.
  //
  // Importante:
  // isso controla apenas a interface,
  // não substitui autorização no banco.
  isAdmin: boolean;

  // Comunica ao componente pai
  // que o usuário escolheu outra seção.
  onChangeTab: (
    tab: AppTab
  ) => void;
}

// Navegação principal da aplicação.
//
// O componente possui:
//
// - uma barra superior no desktop;
// - uma barra inferior no mobile.
//
// Os dois layouts usam
// a mesma lista de itens.
export function AppNavigation({
  activeTab,
  isAdmin,
  onChangeTab,
}: AppNavigationProps) {
  // Administradores recebem
  // uma opção adicional.
  //
  // O spread cria uma nova lista
  // contendo os itens comuns
  // e o item administrativo.
  const items: ReadonlyArray<NavigationItem> =
    isAdmin
      ? [
          ...BASE_ITEMS,
          ADMIN_ITEM,
        ]
      : BASE_ITEMS;

  return (
    <>
      {/* NAVEGAÇÃO DESKTOP

          hidden:
          fica escondida em telas pequenas.

          md:block:
          aparece a partir
          do breakpoint médio.

          sticky top-0:
          permanece no topo
          durante a rolagem. */}
      <nav
        aria-label="Navegação principal"
        className="sticky top-0 z-40 hidden shrink-0 border-b border-[#0a5a40] bg-[#052f22] shadow-sm md:block"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-3 py-2">
            {/* Identificação compacta
                da aplicação */}
            <div className="mr-2 flex items-center gap-2 border-r border-white/10 pr-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/10 text-emerald-50">
                <BadgeDollarSign className="h-4 w-4" />
              </div>

              <div className="leading-tight">
                <p className="text-xs font-black text-white">
                  Bolao Bet
                </p>

                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/60">
                  Copa 2026
                </p>
              </div>
            </div>

            {/* Opções desktop */}
            <div className="flex gap-1">
              {items.map(
                (item) => {
                  // Recupera o componente
                  // de ícone configurado no item.
                  const Icon =
                    item.icon;

                  // Verifica se esta opção
                  // representa a seção atual.
                  const isActive =
                    activeTab === item.id;

                  const stateClassName =
                    isActive
                      ? (
                          'border-emerald-200 ' +
                          'bg-emerald-100 ' +
                          'text-emerald-950'
                        )
                      : (
                          'border-transparent ' +
                          'text-emerald-50/80 ' +
                          'hover:bg-white/10 ' +
                          'hover:text-white'
                        );

                  return (
                    <button
                      key={item.id}
                      type="button"

                      // Comunica a nova aba
                      // ao componente pai.
                      onClick={
                        () =>
                          onChangeTab(
                            item.id
                          )
                      }

                      // Informa semanticamente
                      // qual seção está ativa.
                      aria-current={
                        isActive
                          ? 'page'
                          : undefined
                      }

                      className={
                        `flex items-center gap-2 whitespace-nowrap ` +
                        `rounded-lg border px-4 py-2.5 ` +
                        `text-xs font-bold transition ` +
                        `${stateClassName}`
                      }
                    >
                      <Icon className="h-4 w-4" />

                      <span>
                        {item.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* NAVEGAÇÃO MOBILE

          md:hidden:
          fica visível apenas
          em telas pequenas.

          fixed bottom-0:
          permanece fixa
          na parte inferior. */}
      <nav
        aria-label="Navegação principal mobile"
        className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#0a5a40] bg-[#052f22] shadow-[0_-8px_24px_rgba(15,23,42,0.18)] md:hidden"

        // Reserva espaço para a área
        // inferior segura de dispositivos
        // com navegação por gestos.
        style={{
          paddingBottom:
            'env(safe-area-inset-bottom)',
        }}
      >
        <div
          className="grid min-h-[64px]"

          // Cria automaticamente
          // uma coluna para cada item.
          //
          // Usuário comum:
          // 3 itens → 3 colunas.
          //
          // Admin:
          // 4 itens → 4 colunas.
          style={{
            gridTemplateColumns:
              `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map(
            (item) => {
              const Icon =
                item.icon;

              const isActive =
                activeTab === item.id;

              const stateClassName =
                isActive
                  ? (
                      'bg-emerald-100 ' +
                      'text-emerald-950'
                    )
                  : 'text-emerald-50/75';

              return (
                <button
                  key={item.id}
                  type="button"

                  onClick={
                    () =>
                      onChangeTab(
                        item.id
                      )
                  }

                  aria-current={
                    isActive
                      ? 'page'
                      : undefined
                  }

                  className={
                    `flex min-w-0 flex-col items-center ` +
                    `justify-center gap-1 px-1 py-2 ` +
                    `text-[10px] font-bold transition ` +
                    `${stateClassName}`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  {/* O texto curto reduz
                      a chance de quebrar
                      ou ocupar espaço demais. */}
                  <span className="max-w-full truncate">
                    {item.shortLabel}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </nav>
    </>
  );
}