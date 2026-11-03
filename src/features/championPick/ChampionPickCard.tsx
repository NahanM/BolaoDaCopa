import {
  useState,
} from 'react';

import {
  LockKeyhole,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import type {
  ChampionPick,
  ChampionPickTeam,
} from '../../types';

// Define as informações e funções
// que o componente recebe do componente pai.
interface ChampionPickCardProps {
  // Quantidade total de pontos
  // disponíveis na Bolsa Campeão.
  //
  // É opcional porque o componente
  // possui um valor padrão.
  bonusPoints?: number;

  // Indica se o período de escolhas
  // está atualmente aberto.
  isOpen?: boolean;

  // Lista das seleções que podem
  // ser escolhidas pelos participantes.
  eligibleTeams?: ChampionPickTeam[];

  // Escolha já realizada
  // pelo usuário atual.
  //
  // null significa que o usuário
  // ainda não escolheu uma seleção.
  currentPick?: ChampionPick | null;

  // Indica se existe um usuário
  // autenticado no sistema.
  isUserLoggedIn?: boolean;

  // Indica se a escolha
  // está sendo salva.
  //
  // Enquanto for true,
  // os campos ficam bloqueados.
  isSavingPick?: boolean;

  // Indica que o bolão foi encerrado.
  isClosed?: boolean;

  // Função responsável por salvar
  // a seleção escolhida.
  //
  // É opcional porque o componente
  // também pode ser usado apenas
  // para exibir informações.
  onPickTeam?: (
    team: ChampionPickTeam
  ) => void | Promise<void>;
}

// Escolhe a mensagem exibida
// quando o usuário não pode realizar
// uma escolha neste momento.
function getPickUnavailableMessage(
  isOpen: boolean,
  isUserLoggedIn: boolean,
  eligibleTeamsCount: number,
  isClosed: boolean
): string {
  // O bolão acabou: não há mais o que liberar.
  if (isClosed) {
    return 'A Bolsa Campeão foi encerrada.';
  }

  // A funcionalidade ainda não foi liberada.
  if (!isOpen) {
    return (
      'A lista será liberada quando ' +
      'chegarmos na fase de mata-mata.'
    );
  }

  // A funcionalidade está aberta,
  // mas o usuário não está autenticado.
  if (!isUserLoggedIn) {
    return (
      'Entre com sua conta Google ' +
      'para escolher sua campeã.'
    );
  }

  // O usuário está autenticado,
  // mas o administrador ainda não
  // cadastrou seleções disponíveis.
  if (eligibleTeamsCount === 0) {
    return (
      'O admin ainda não cadastrou ' +
      'as seleções disponíveis.'
    );
  }

  // Caso geral para alguma outra condição
  // que impeça a escolha.
  //
  // Por exemplo:
  // onPickTeam não foi fornecida.
  return (
    'A escolha ainda não está disponível.'
  );
}

// Card da Bolsa Campeão exibido
// para os participantes.
//
// O componente permite:
//
// - visualizar o total de pontos;
// - verificar se a escolha está aberta;
// - ver quantas seleções estão disponíveis;
// - escolher uma seleção;
// - visualizar uma escolha já confirmada.
export function ChampionPickCard({
  // Valores padrão usados quando
  // o componente pai não envia uma propriedade.
  bonusPoints = 30,
  isOpen = false,
  eligibleTeams = [],
  currentPick = null,
  isUserLoggedIn = false,
  isSavingPick = false,
  isClosed = false,
  onPickTeam,
}: ChampionPickCardProps) {
  // Guarda o código da seleção
  // escolhida no campo select.
  //
  // Começa vazio porque nenhuma opção
  // foi escolhida no formulário.
  const [
    selectedTeamCode,
    setSelectedTeamCode,
  ] = useState('');

  // Procura o objeto completo da seleção
  // correspondente ao código escolhido.
  //
  // Exemplo:
  //
  // selectedTeamCode = 'BRA'
  //
  // eligibleTeams.find(...) pode retornar:
  //
  // {
  //   code: 'BRA',
  //   name: 'Brasil',
  //   logo: 'https://...'
  // }
  //
  // Caso nenhum código corresponda,
  // o resultado será undefined.
  const selectedTeam =
    eligibleTeams.find(
      (team) =>
        team.code ===
        selectedTeamCode
    );

  // Define se o formulário de escolha
  // pode ser mostrado ao usuário.
  //
  // Todas as condições precisam ser verdadeiras.
  const canPick =
    // O período precisa estar aberto.
    isOpen &&

    // O usuário precisa estar autenticado.
    isUserLoggedIn &&

    // O usuário ainda não pode
    // ter realizado uma escolha.
    !currentPick &&

    // Precisa existir pelo menos
    // uma seleção disponível.
    eligibleTeams.length > 0 &&

    // A função responsável pelo salvamento
    // precisa ter sido fornecida.
    Boolean(onPickTeam);

  // Mensagem usada quando a escolha
  // não está disponível.
  const unavailableMessage =
    getPickUnavailableMessage(
      isOpen,
      isUserLoggedIn,
      eligibleTeams.length,
      isClosed
    );

  // Executa quando o usuário clica
  // no botão de confirmar a escolha.
  const handleConfirmPick =
    async () => {
      // Não continua caso:
      //
      // - nenhuma seleção tenha sido escolhida;
      // - a função de salvamento não exista;
      // - um salvamento já esteja acontecendo.
      if (
        !selectedTeam ||
        !onPickTeam ||
        isSavingPick
      ) {
        return;
      }

      // Abre uma confirmação nativa
      // do navegador.
      //
      // window.confirm retorna:
      //
      // true:
      // o usuário confirmou.
      //
      // false:
      // o usuário cancelou.
      const confirmed =
        window.confirm(
          `Confirmar ${selectedTeam.name} ` +
          'como sua seleção campeã? ' +
          'Essa escolha não poderá ser alterada.'
        );

      // Interrompe a função
      // caso o usuário cancele.
      if (!confirmed) {
        return;
      }

      // Envia o objeto completo da seleção
      // para a função recebida do componente pai.
      await onPickTeam(
        selectedTeam
      );
    };

  return (
    // Card principal da Bolsa Campeão.
    //
    // aside representa um conteúdo complementar
    // em relação ao conteúdo principal da página.
    <aside className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
      {/* Cabeçalho do card */}
      <div className="flex items-start justify-between gap-3">
        <div>
          {/* Pequena identificação visual
              da funcionalidade */}
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
            <Trophy className="h-3.5 w-3.5" />

            Bolsa Campeão
          </div>

          {/* Total de pontos disponíveis */}
          <h3 className="mt-3 text-lg font-black leading-tight text-slate-950">
            {bonusPoints} pts em jogo
          </h3>

          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
            Escolha a seleção campeã no mata-mata. Quanto menos gente escolher
            o campeão, maior pode ser o bônus.
          </p>
        </div>

        {/* Ícone que muda de acordo
            com a disponibilidade da escolha */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          {isOpen
            ? (
                // Quando a escolha está aberta,
                // mostra um ícone de crescimento.
                <TrendingUp className="h-5 w-5" />
              )
            : (
                // Quando está fechada,
                // mostra um cadeado.
                <LockKeyhole className="h-5 w-5" />
              )}
        </div>
      </div>

      {/* Área interna com o status
          e a interação do participante */}
      <div className="mt-4 rounded-lg border border-amber-100 bg-white/80 p-3">
        {/* Status da Bolsa Campeão */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-600">
            Status
          </span>

          <span
            className={
              isOpen
                ? (
                    'rounded-md bg-emerald-100 px-2 py-1 ' +
                    'text-[10px] font-black uppercase tracking-wide ' +
                    'text-emerald-700'
                  )
                : (
                    'rounded-md bg-slate-100 px-2 py-1 ' +
                    'text-[10px] font-black uppercase tracking-wide ' +
                    'text-slate-600'
                  )
            }
          >
            {isOpen
              ? 'Aberta'
              : 'Fechada'}
          </span>
        </div>

        {/* Quantidade de seleções disponíveis */}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-600">
            Seleções disponíveis
          </span>

          <strong className="text-slate-950">
            {eligibleTeams.length}
          </strong>
        </div>

        {/* Existem três possíveis conteúdos
            para esta parte do card:

            1. O usuário já escolheu uma seleção.
            2. O usuário pode realizar uma escolha.
            3. A escolha não está disponível. */}

        {currentPick
          ? (
              // PRIMEIRA SITUAÇÃO:
              //
              // O usuário já realizou
              // e salvou sua escolha.
              <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">
                  Sua escolha
                </p>

                <div className="mt-2 flex items-center gap-3">
                  {/* Quando existe logo,
                      mostra a imagem da seleção.

                      Caso contrário,
                      mostra o código dentro
                      de um quadrado. */}
                  {currentPick.teamLogo
                    ? (
                        <img
                          src={currentPick.teamLogo}
                          alt={currentPick.teamName}
                          className="h-8 w-8 object-contain"
                          loading="lazy"
                        />
                      )
                    : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[10px] font-black text-slate-700">
                          {currentPick.teamCode}
                        </div>
                      )}

                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {currentPick.teamName}
                    </p>

                    <p className="text-[11px] font-semibold text-slate-500">
                      Escolha travada
                    </p>
                  </div>
                </div>
              </div>
            )
          : canPick
            ? (
                // SEGUNDA SITUAÇÃO:
                //
                // O usuário ainda não escolheu
                // e todas as condições permitem
                // realizar uma escolha.
                <div className="mt-4 space-y-3">
                  <label
                    htmlFor="champion-pick-team"
                    className="space-y-1"
                  >
                    <span className="text-xs font-bold text-slate-700">
                      Escolha sua campeã
                    </span>
                  </label>

                  {/* Select controlado pelo estado
                      selectedTeamCode. */}
                  <select
                    id="champion-pick-team"
                    value={selectedTeamCode}

                    onChange={
                      (event) =>
                        setSelectedTeamCode(
                          event.target.value
                        )
                    }

                    disabled={isSavingPick}

                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
                  >
                    {/* Opção inicial sem seleção */}
                    <option value="">
                      Selecione...
                    </option>

                    {/* map transforma cada seleção
                        em uma opção do select. */}
                    {eligibleTeams.map(
                      (team) => (
                        <option
                          key={team.code}
                          value={team.code}
                        >
                          {team.name}
                        </option>
                      )
                    )}
                  </select>

                  {/* Botão que confirma
                      a seleção escolhida */}
                  <button
                    type="button"
                    onClick={
                      handleConfirmPick
                    }

                    // O botão fica bloqueado quando:
                    //
                    // - nenhuma seleção foi escolhida;
                    // - o salvamento está acontecendo.
                    disabled={
                      !selectedTeam ||
                      isSavingPick
                    }

                    className="w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-black text-white transition hover:bg-amber-700 disabled:bg-slate-400"
                  >
                    {isSavingPick
                      ? 'Salvando...'
                      : 'Confirmar escolha'}
                  </button>
                </div>
              )
            : (
                // TERCEIRA SITUAÇÃO:
                //
                // O usuário ainda não escolheu,
                // mas alguma condição impede
                // a realização da escolha.
                <p className="mt-3 text-[11px] font-semibold leading-relaxed text-slate-500">
                  {unavailableMessage}
                </p>
              )}
      </div>
    </aside>
  );
}