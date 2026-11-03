import {
  CalendarClock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

import {
  ChampionPickCard,
} from '../championPick/ChampionPickCard';

import type {
  ChampionPick,
  ChampionPickSettings,
  ChampionPickTeam,
} from '../../types';

// Passos exibidos enquanto o bolão está aberto.
const HOW_IT_WORKS_STEPS = [
  'Entre com sua conta Google para criar seu perfil.',
  'Faça seus palpites antes do início das partidas.',
  'Depois que o admin lançar o resultado oficial, o ranking é recalculado automaticamente.',
  'Use os botões de compartilhamento para mandar seus palpites no WhatsApp.',
];

// Os mesmos passos, no passado, depois do encerramento.
const CLOSED_HOW_IT_WORKS_STEPS = [
  'Cada participante entrava com a conta Google.',
  'Os palpites eram feitos antes do início das partidas.',
  'Depois que o admin lançava o resultado oficial, o ranking era recalculado automaticamente.',
  'Os botões de compartilhamento mandavam os palpites no WhatsApp.',
];

// Define todos os dados e ações
// que a página inicial recebe do componente pai.
//
// A HomePage não busca nem calcula esses dados.
// Ela apenas recebe os valores prontos
// e os apresenta na interface.
interface HomePageProps {
  // Valor total arrecadado no bolão.
  totalPrizePool: number;

  // Valor destinado ao primeiro colocado.
  firstPrize: number;

  // Valor destinado ao segundo colocado.
  secondPrize: number;

  // Quantidade atual de participantes.
  participantsCount: number;

  // Configuração completa da Bolsa Campeão.
  championPickSettings:
    ChampionPickSettings;

  // Escolha de campeão feita
  // pelo usuário atualmente logado.
  //
  // null significa que o usuário
  // ainda não realizou uma escolha.
  currentChampionPick:
    ChampionPick | null;

  // Indica se existe um usuário autenticado.
  isUserLoggedIn: boolean;

  // Indica se a escolha de campeão
  // está sendo salva.
  isSavingChampionPick: boolean;

  // Indica que o bolão foi encerrado.
  isClosed?: boolean;

  // Função responsável por salvar
  // a seleção escolhida pelo usuário.
  onPickChampionTeam: (
    team: ChampionPickTeam
  ) => void | Promise<void>;

  // Função usada para navegar
  // até a tela de partidas.
  onGoToMatches: () => void;

  // Função usada para navegar
  // até a tela de classificação.
  onGoToRanking: () => void;
}

// Página inicial do Bolão da Copa.
//
// Ela apresenta:
//
// - introdução do sistema;
// - botões de navegação;
// - quantidade de participantes;
// - regras rápidas;
// - distribuição da premiação;
// - Bolsa Campeão;
// - regras de pontuação;
// - explicação geral do bolão.
export function HomePage({
  totalPrizePool,
  firstPrize,
  secondPrize,
  participantsCount,
  championPickSettings,
  currentChampionPick,
  isUserLoggedIn,
  isSavingChampionPick,
  isClosed = false,
  onPickChampionTeam,
  onGoToMatches,
  onGoToRanking,
}: HomePageProps) {
  // A Bolsa Campeão fica aberta somente quando:
  //
  // enabled:
  // a funcionalidade foi liberada pelo admin.
  //
  // locked:
  // o prazo ainda não foi encerrado.
  //
  // Portanto:
  //
  // enabled = true
  // locked = false
  //
  // resultado:
  // escolha aberta.
  //
  // O encerramento do bolão fecha a escolha,
  // seja qual for a configuração salva.
  const isChampionPickOpen =
    !isClosed &&
    championPickSettings.enabled &&
    !championPickSettings.locked;

  return (
    // Elemento principal da página inicial.
    //
    // space-y-6 adiciona espaçamento vertical
    // entre as seções internas.
    //
    // O id pode ser usado para navegação,
    // testes ou identificação da tela.
    <div
      id="home-view"
      className="space-y-6"
    >
      {/* Seção principal da página.

          Em telas menores, o conteúdo
          fica organizado em uma coluna.

          Em telas grandes, a área é dividida:
          - conteúdo principal à esquerda;
          - premiação e Bolsa Campeão à direita. */}
      <section className="app-card app-card-padding">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          {/* COLUNA DA ESQUERDA */}
          <div className="space-y-4">
            {/* Pequeno destaque indicando
                a atualização em tempo real */}
            {!isClosed && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5" />

                <span>
                  Bolão sincronizado em tempo real
                </span>
              </div>
            )}

            {/* Título e explicação principal */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black leading-tight tracking-tight text-slate-900 md:text-3xl">
                {isClosed
                  ? 'O bolão da Copa 2026 terminou. Confira como foi a disputa.'
                  : 'Faça seus palpites com calma e acompanhe a disputa da Copa.'}
              </h2>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                {isClosed
                  ? 'O site segue no ar só para consulta: veja o ranking final, as partidas e os palpites de cada participante, sem precisar entrar.'
                  : 'O app salva os palpites, calcula a pontuação automaticamente e ajuda a compartilhar tudo no WhatsApp sem planilhas soltas.'}
              </p>
            </div>

            {/* Botões de navegação.

                No celular, ficam um abaixo do outro.

                A partir do breakpoint sm,
                ficam lado a lado. */}
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              {!isClosed && (
                <button
                  type="button"

                  // A HomePage não controla
                  // diretamente qual tela será aberta.
                  //
                  // Ela apenas chama a função
                  // recebida do componente pai.
                  onClick={onGoToMatches}

                  className="app-button-primary py-2.5"
                >
                  Fazer meus palpites
                </button>
              )}

              <button
                type="button"
                onClick={onGoToRanking}
                className="app-button-secondary"
              >
                Ver classificação
              </button>
            </div>

            {/* Mini cards informativos.

                grid-cols-1:
                uma coluna no celular.

                sm:grid-cols-3:
                três colunas em telas maiores. */}
            <div className="grid max-w-3xl grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
              {/* Quantidade de participantes */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Users className="h-4 w-4" />

                  <span className="text-[11px] font-black uppercase tracking-wide">
                    Participantes
                  </span>
                </div>

                {/* Valor dinâmico recebido por props */}
                <p className="mt-2 text-xl font-black text-slate-950">
                  {participantsCount}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Entraram no prêmio total.
                </p>
              </div>

              {/* Regra de bloqueio dos palpites */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <CalendarClock className="h-4 w-4" />

                  <span className="text-[11px] font-black uppercase tracking-wide">
                    Bloqueio
                  </span>
                </div>

                <p className="mt-2 text-xl font-black text-slate-950">
                  No horário
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Começou o jogo, o palpite trava.
                </p>
              </div>

              {/* Informação sobre o ranking */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Zap className="h-4 w-4" />

                  <span className="text-[11px] font-black uppercase tracking-wide">
                    Ranking
                  </span>
                </div>

                <p className="mt-2 text-xl font-black text-slate-950">
                  Auto
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Pontuação recalculada após resultado.
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DA DIREITA */}
          <div className="space-y-4">
            {/* aside representa um conteúdo complementar
                ao conteúdo principal da página.

                Neste caso, mostra a premiação. */}
            <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              {/* Valor total arrecadado */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Prêmio total
                  </p>

                  <p className="text-2xl font-black text-emerald-700">
                    {/* toFixed(2) garante
                        duas casas decimais.

                        Exemplo:
                        150 vira 150.00 */}
                    R$ {totalPrizePool.toFixed(2)}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Trophy className="h-5 w-5" />
                </div>
              </div>

              {/* Distribuição da premiação */}
              <div className="mt-4 space-y-3">
                {/* Primeiro lugar */}
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>
                      1º lugar
                    </span>

                    <span>
                      R$ {firstPrize.toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Recebe 80% do valor arrecadado.
                  </p>

                  {/* Barra visual representando 80%.

                      style recebe um objeto JavaScript
                      dentro do JSX.

                      Em HTML tradicional seria:
                      style="width: 80%"

                      No React fica:
                      style={{ width: '80%' }} */}
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-emerald-700"
                      style={{
                        width: '80%',
                      }}
                    />
                  </div>
                </div>

                {/* Segundo lugar */}
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>
                      2º lugar
                    </span>

                    <span>
                      R$ {secondPrize.toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Recebe 20% do valor arrecadado.
                  </p>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-slate-500"
                      style={{
                        width: '20%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-600">
                <span>
                  Participantes pagantes
                </span>

                <strong className="text-slate-900">
                  {participantsCount}
                </strong>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Entrada por pessoa
                </span>

                <strong className="text-slate-900">
                  R$ 10,00
                </strong>
              </div>
            </aside>

            {/* Componente reutilizável da Bolsa Campeão.

                A HomePage prepara os dados
                e passa cada informação como prop. */}
            <ChampionPickCard
              bonusPoints={
                championPickSettings
                  .bonusPoints
              }

              // A funcionalidade só fica aberta
              // quando está liberada e não travada.
              isOpen={
                isChampionPickOpen
              }

              eligibleTeams={
                championPickSettings
                  .eligibleTeams
              }

              currentPick={
                currentChampionPick
              }

              isUserLoggedIn={
                isUserLoggedIn
              }

              isSavingPick={
                isSavingChampionPick
              }

              isClosed={isClosed}

              onPickTeam={
                onPickChampionTeam
              }
            />
          </div>
        </div>
      </section>

      {/* Seção com as regras de pontuação.

          article representa um bloco independente
          dentro de uma seção. */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Regra de três pontos */}
        <article className="app-card space-y-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-xs font-black text-amber-700">
            3
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Acerto exato
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Você acerta o placar certinho dos dois times. Exemplo: palpite
              2x1 e resultado 2x1.
            </p>
          </div>
        </article>

        {/* Regra de um ponto */}
        <article className="app-card space-y-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xs font-black text-blue-700">
            1
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Acerto parcial
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Você acerta o vencedor ou o empate, mas erra o placar exato.
              Exemplo: palpite 3x1 e resultado 1x0.
            </p>
          </div>
        </article>

        {/* Regra de zero pontos */}
        <article className="app-card space-y-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">
            0
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Erro
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Quando o resultado do jogo não bate com o seu palpite. Nesse caso,
              a partida não soma pontos.
            </p>
          </div>
        </article>
      </section>

      {/* Explicação passo a passo
          do funcionamento do sistema */}
      <section className="app-card p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
            <MessageSquare className="h-5 w-5" />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isClosed
                  ? 'Como o bolão funcionou?'
                  : 'Como o bolão funciona?'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                A ideia é deixar tudo simples no celular e transparente para
                quem administra.
              </p>
            </div>

            {/* ol cria uma lista ordenada.

                Como possui list-decimal,
                os itens aparecem numerados. */}
            <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-slate-600">
              {(isClosed
                ? CLOSED_HOW_IT_WORKS_STEPS
                : HOW_IT_WORKS_STEPS
              ).map((step) => (
                <li key={step}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Aviso final sobre o bloqueio
          dos palpites */}
      <section className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />

        <div>
          <h3 className="text-sm font-bold text-emerald-950">
            Regra importante
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-emerald-800">
            {isClosed
              ? 'Os palpites precisavam ser enviados antes da partida começar. Depois do horário do jogo, o sistema bloqueava alterações.'
              : 'Os palpites devem ser enviados antes da partida começar. Depois do horário do jogo, o sistema bloqueia alterações.'}
          </p>
        </div>
      </section>
    </div>
  );
}