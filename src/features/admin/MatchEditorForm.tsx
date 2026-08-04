import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import {
  CalendarPlus,
  Pencil,
  Save,
  ShieldCheck,
} from 'lucide-react';

import type {
  Match,
} from '../../types';

// Define os dois modos disponíveis
// no formulário:
//
// create:
// cadastra uma nova partida.
//
// edit:
// altera uma partida já existente.
type MatchEditorMode =
  'create' | 'edit';

// Define as informações e funções
// recebidas do componente pai.
interface MatchEditorFormProps {
  // Lista de partidas existentes.
  //
  // Ela é utilizada para:
// - preencher a seleção no modo de edição;
// - gerar o próximo ID automático;
// - verificar se um ID já está sendo usado.
  matches: Match[];

  // Função responsável por salvar
  // a partida de verdade.
  //
  // O componente prepara o objeto Match,
  // mas não acessa diretamente o Firebase.
  onSaveMatch: (
    match: Match,
    mode: MatchEditorMode
  ) => void | Promise<void>;

  // Callback usado para exibir
  // uma mensagem de sucesso.
  onSuccess: (
    message: string
  ) => void;

  // Callback usado para exibir
  // uma mensagem de erro.
  onError: (
    message: string
  ) => void;
}

// Representa somente os campos
// que aparecem no formulário.
//
// Ele é separado de Match porque:
//
// - date precisa ficar no formato do input HTML;
// - os campos de placar não são editados aqui;
// - status e timestamps são montados no envio;
// - venue e city ficam como strings vazias no formulário.
interface MatchFormState {
  id: string;
  teamA: string;
  flagA: string;
  teamB: string;
  flagB: string;
  date: string;
  time: string;
  group: string;
  venue: string;
  city: string;
}

// Estado totalmente vazio do formulário.
//
// É utilizado principalmente quando
// não existe partida disponível para edição.
const EMPTY_FORM:
  MatchFormState = {
    id: '',
    teamA: '',
    flagA: '',
    teamB: '',
    flagB: '',
    date: '',
    time: '',
    group: '',
    venue: '',
    city: '',
  };

// Gera o próximo código interno
// seguindo o formato m1, m2, m3...
//
// A função procura o maior número
// entre os IDs que seguem esse padrão
// e soma mais um.
function getNextMatchId(
  matches: Match[]
): string {
  const highestNumber =
    matches.reduce(
      (
        highest,
        match
      ) => {
        // A expressão aceita IDs como:
        //
        // m1
        // m20
        // M35
        //
        // O grupo (\d+) captura apenas
        // a parte numérica.
        const matchNumber =
          /^m(\d+)$/i.exec(
            match.id
          )?.[1];

        // IDs que não seguem o padrão
        // m + número são ignorados.
        if (!matchNumber) {
          return highest;
        }

        return Math.max(
          highest,
          Number(matchNumber)
        );
      },
      0
    );

  return `m${highestNumber + 1}`;
}

// Converte uma data salva no projeto
// para o formato exigido pelo input type="date".
//
// Formato salvo no projeto:
//
// 06/07/2026
//
// Formato utilizado pelo input:
//
// 2026-07-06
function toDateInputValue(
  date: string
): string {
  // Caso a data já esteja no formato
  // esperado pelo input, mantém o valor.
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    return date;
  }

  const [
    day,
    month,
    year,
  ] = date.split('/');

  // Se alguma parte estiver ausente,
  // não existe uma data segura para mostrar.
  if (
    !day ||
    !month ||
    !year
  ) {
    return '';
  }

  // padStart adiciona zero à esquerda
  // quando dia ou mês possuem um dígito.
  //
  // 7 vira 07.
  return (
    `${year}-` +
    `${month.padStart(2, '0')}-` +
    `${day.padStart(2, '0')}`
  );
}

// Converte o valor do input type="date"
// para o formato brasileiro usado pelo projeto.
//
// 2026-07-06
//
// vira:
//
// 06/07/2026
function toBrazilianDate(
  date: string
): string {
  const [
    year,
    month,
    day,
  ] = date.split('-');

  return `${day}/${month}/${year}`;
}

// Combina data e horário
// utilizando o fuso -03:00.
//
// Depois converte o resultado
// para uma string ISO.
//
// Exemplo aproximado:
//
// 2026-07-06T16:30:00-03:00
//
// vira:
//
// 2026-07-06T19:30:00.000Z
function toSaoPauloIso(
  date: string,
  time: string
): string {
  const dateTime =
    new Date(
      `${date}T${time}:00-03:00`
    );

  return dateTime.toISOString();
}

// Combina data e horário
// e devolve o timestamp em milissegundos.
//
// Esse valor facilita ordenações
// e comparações de horário.
function toSaoPauloMs(
  date: string,
  time: string
): number {
  const dateTime =
    new Date(
      `${date}T${time}:00-03:00`
    );

  return dateTime.getTime();
}

// Converte uma partida existente
// para o formato utilizado pelo formulário.
//
// Essa função é utilizada
// quando o modo de edição é ativado.
function toFormState(
  match: Match
): MatchFormState {
  return {
    id: match.id,
    teamA: match.teamA,
    flagA: match.flagA,
    teamB: match.teamB,
    flagB: match.flagB,

    // Converte a data brasileira
    // para o formato do input HTML.
    date:
      toDateInputValue(
        match.date
      ),

    time: match.time,
    group: match.group,

    // Campos opcionais precisam virar
    // strings vazias para controlar os inputs.
    venue:
      match.venue ?? '',

    city:
      match.city ?? '',
  };
}

// Cria o estado inicial
// para o cadastro de um novo jogo.
//
// O ID é calculado com base
// nas partidas já existentes.
function createEmptyForm(
  matches: Match[]
): MatchFormState {
  return {
    ...EMPTY_FORM,

    id:
      getNextMatchId(
        matches
      ),

    // Deixa um texto inicial
    // para facilitar o preenchimento.
    group: 'Grupo ',
  };
}

// Formulário administrativo responsável
// por cadastrar e editar partidas.
//
// O componente possui dois modos:
//
// create:
// cria um novo Match.
//
// edit:
// carrega um Match existente,
// permite alterar os dados
// e preserva seu status e placar final.
export function MatchEditorForm({
  matches,
  onSaveMatch,
  onSuccess,
  onError,
}: MatchEditorFormProps) {
  // Controla se o formulário
  // está criando ou editando.
  const [
    mode,
    setMode,
  ] = useState<MatchEditorMode>(
    'create'
  );

  // Guarda o ID da partida selecionada
  // no modo de edição.
  //
  // Caso exista alguma partida,
  // começa utilizando a primeira.
  const [
    selectedMatchId,
    setSelectedMatchId,
  ] = useState(
    matches[0]?.id ?? ''
  );

  // Guarda todos os campos
  // atualmente exibidos no formulário.
  //
  // A função passada ao useState
  // é executada apenas na inicialização.
  const [
    form,
    setForm,
  ] = useState<MatchFormState>(
    () =>
      createEmptyForm(
        matches
      )
  );

  // Indica se uma operação
  // de salvamento está acontecendo.
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  // Procura na lista a partida
  // que possui o ID selecionado.
  //
  // useMemo reaproveita o resultado
  // enquanto matches e selectedMatchId
  // não forem alterados.
  const selectedMatch =
    useMemo(
      () =>
        matches.find(
          (match) =>
            match.id ===
            selectedMatchId
        ),

      [
        matches,
        selectedMatchId,
      ]
    );

  // Mantém o formulário sincronizado
  // quando a lista de partidas,
  // o modo ou a seleção mudam.
  useEffect(() => {
    // No modo de criação,
    // mantém os dados que já foram digitados.
    //
    // Apenas gera um ID novo
    // caso o campo esteja vazio.
    if (mode === 'create') {
      setForm(
        (currentForm) => ({
          ...currentForm,

          id:
            currentForm.id ||
            getNextMatchId(
              matches
            ),
        })
      );

      return;
    }

    // No modo de edição,
    // se não existem partidas,
    // limpa a seleção e o formulário.
    if (matches.length === 0) {
      setSelectedMatchId('');

      setForm({
        ...EMPTY_FORM,
      });

      return;
    }

    // Mantém a partida selecionada
    // quando ela ainda existir.
    //
    // Caso tenha sido removida,
    // utiliza a primeira partida disponível.
    const nextSelectedMatch =
      selectedMatch ??
      matches[0];

    setSelectedMatchId(
      nextSelectedMatch.id
    );

    setForm(
      toFormState(
        nextSelectedMatch
      )
    );
  }, [
    matches,
    mode,
    selectedMatch,
  ]);

  // Atualiza um campo específico
  // do estado do formulário.
//
// keyof MatchFormState permite somente
// nomes de campos que realmente existem
// dentro de MatchFormState.
  const updateField = (
    field: keyof MatchFormState,
    value: string
  ) => {
    setForm(
      (currentForm) => ({
        ...currentForm,

        // Propriedade dinâmica.
        //
        // Se field for "teamA",
        // atualiza apenas form.teamA.
        [field]: value,
      })
    );
  };

  // Altera o modo do editor
  // entre criação e edição.
  const handleModeChange = (
    nextMode: MatchEditorMode
  ) => {
    setMode(nextMode);

    // Ao entrar no modo de criação,
    // limpa o formulário e gera um novo ID.
    if (nextMode === 'create') {
      setForm(
        createEmptyForm(
          matches
        )
      );

      return;
    }

    // Ao entrar no modo de edição,
    // carrega a primeira partida disponível.
    if (matches[0]) {
      setSelectedMatchId(
        matches[0].id
      );

      setForm(
        toFormState(
          matches[0]
        )
      );
    }
  };

  // Executa quando o administrador
  // escolhe outra partida no select.
  const handleMatchChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const match =
      matches.find(
        (item) =>
          item.id ===
          event.target.value
      );

    // Não altera o formulário
    // se o ID não for encontrado.
    if (!match) {
      return;
    }

    setSelectedMatchId(
      match.id
    );

    setForm(
      toFormState(match)
    );
  };

  // Valida os campos antes
  // de montar e salvar a partida.
//
// A função retorna:
//
// string:
// mensagem do erro encontrado.
//
// null:
// formulário válido.
  const validateForm = ():
    string | null => {
    const id =
      form.id.trim();

    // O ID só pode possuir:
    // - letras;
    // - números;
    // - underline;
    // - hífen.
    if (
      !id ||
      !/^[a-zA-Z0-9_-]+$/.test(
        id
      )
    ) {
      return (
        'Use um código interno simples, ' +
        'como m9 ou jogo-9.'
      );
    }

    // Durante a criação,
    // não permite reutilizar
    // o ID de outra partida.
    if (
      mode === 'create' &&
      matches.some(
        (match) =>
          match.id === id
      )
    ) {
      return (
        'Já existe uma partida ' +
        'com esse código interno.'
      );
    }

    if (
      !form.teamA.trim() ||
      !form.teamB.trim()
    ) {
      return (
        'Informe os dois times ' +
        'da partida.'
      );
    }

    if (
      !form.flagA.trim() ||
      !form.flagB.trim()
    ) {
      return (
        'Informe as duas bandeiras.'
      );
    }

    if (
      !form.date ||
      !form.time
    ) {
      return (
        'Informe data e horário ' +
        'no Brasil.'
      );
    }

    if (!form.group.trim()) {
      return (
        'Informe o grupo, fase ' +
        'ou rodada.'
      );
    }

    return null;
  };

  // Executa quando o formulário
  // é enviado.
  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    // Evita o recarregamento
    // padrão da página.
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      onError(
        validationError
      );

      return;
    }

    // No modo de edição,
    // guarda a partida original.
    //
    // Ela será usada para preservar
    // status e placares finalizados.
    const existingMatch =
      mode === 'edit'
        ? selectedMatch
        : undefined;

    const venue =
      form.venue.trim();

    const city =
      form.city.trim();

    // Monta o objeto Match
    // que será enviado para salvamento.
    const nextMatch: Match = {
      id:
        form.id.trim(),

      teamA:
        form.teamA.trim(),

      flagA:
        form.flagA.trim(),

      teamB:
        form.teamB.trim(),

      flagB:
        form.flagB.trim(),

      // Converte o formato do input
      // para o formato brasileiro.
      date:
        toBrazilianDate(
          form.date
        ),

      time:
        form.time,

      // Monta as duas representações
      // do horário da partida.
      startsAt:
        toSaoPauloIso(
          form.date,
          form.time
        ),

      startsAtMs:
        toSaoPauloMs(
          form.date,
          form.time
        ),

      // Em uma edição,
      // preserva o status existente.
      //
      // Em uma criação,
      // começa como scheduled.
      status:
        existingMatch?.status ??
        'scheduled',

      group:
        form.group.trim(),
    };

    // Campos opcionais só são adicionados
    // quando possuem conteúdo.
    if (venue) {
      nextMatch.venue =
        venue;
    }

    if (city) {
      nextMatch.city =
        city;
    }

    // Se a partida já foi finalizada
    // e possui os dois placares,
    // preserva o resultado existente.
    //
    // Este formulário não edita placares.
    if (
      existingMatch?.status ===
        'finished' &&
      typeof existingMatch.scoreA ===
        'number' &&
      typeof existingMatch.scoreB ===
        'number'
    ) {
      nextMatch.scoreA =
        existingMatch.scoreA;

      nextMatch.scoreB =
        existingMatch.scoreB;
    }

    try {
      // Bloqueia o formulário
      // durante o salvamento.
      setIsSaving(true);

      // Envia a partida preparada
      // e o modo atual para o componente pai.
      await onSaveMatch(
        nextMatch,
        mode
      );

      if (mode === 'create') {
        onSuccess(
          'Jogo cadastrado. ' +
          'Ele já aparece para os participantes.'
        );

        // Prepara o formulário
        // para o próximo cadastro.
        //
        // A partida recém-criada é adicionada
        // temporariamente à lista usada
        // para calcular o próximo ID.
        setForm(
          createEmptyForm([
            ...matches,
            nextMatch,
          ])
        );

        return;
      }

      onSuccess(
        'Jogo atualizado sem alterar ' +
        'os palpites já salvos.'
      );
    } catch (error) {
      // Mantém detalhes do erro no console
      // para ajudar durante o desenvolvimento.
      console.warn(
        'Erro ao salvar jogo:',
        error
      );

      onError(
        'Não foi possível salvar ' +
        'o jogo no banco agora.'
      );
    } finally {
      // Libera novamente o formulário
      // em caso de sucesso ou erro.
      setIsSaving(false);
    }
  };

  // Texto exibido no botão principal.
  //
  // A variável evita deixar
  // um ternário aninhado dentro do JSX.
  let submitButtonText =
    'Cadastrar jogo';

  if (isSaving) {
    submitButtonText =
      'Salvando...';
  } else if (mode === 'edit') {
    submitButtonText =
      'Salvar alterações do jogo';
  }

  const editModeHasNoMatches =
    mode === 'edit' &&
    matches.length === 0;

  return (
    // Card principal do editor.
    <section className="app-card app-card-padding space-y-5">
      {/* Cabeçalho */}
      <div className="app-card-header">
        <CalendarPlus className="h-5 w-5 text-emerald-700" />

        <h3 className="app-section-title">
          Gerenciar jogos
        </h3>
      </div>

      {/* Seletor visual de modo:
          cadastrar ou editar. */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={
            () =>
              handleModeChange(
                'create'
              )
          }
          disabled={isSaving}
          className={
            `flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition ${
              mode === 'create'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <CalendarPlus className="h-3.5 w-3.5" />

          <span>
            Novo jogo
          </span>
        </button>

        <button
          type="button"
          onClick={
            () =>
              handleModeChange(
                'edit'
              )
          }
          disabled={isSaving}
          className={
            `flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition ${
              mode === 'edit'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Pencil className="h-3.5 w-3.5" />

          <span>
            Editar jogo
          </span>
        </button>
      </div>

      {/* O seletor de partidas aparece
          somente no modo de edição. */}
      {mode === 'edit' && (
        <div>
          <label
            htmlFor="match-editor-selected-match"
            className="app-label"
          >
            Partida cadastrada
          </label>

          <select
            id="match-editor-selected-match"
            value={selectedMatchId}
            onChange={handleMatchChange}
            className="app-select"
            disabled={
              matches.length === 0 ||
              isSaving
            }
          >
            {matches.length === 0
              ? (
                  <option value="">
                    Nenhuma partida cadastrada
                  </option>
                )
              : (
                  matches.map(
                    (match) => (
                      <option
                        key={match.id}
                        value={match.id}
                      >
                        [{match.id}]{' '}
                        {match.flagA}{' '}
                        {match.teamA}{' '}
                        x{' '}
                        {match.teamB}{' '}
                        {match.flagB}{' '}
                        - {match.date}{' '}
                        às {match.time}
                      </option>
                    )
                  )
                )}
          </select>
        </div>
      )}

      {/* Formulário principal */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Código interno e fase */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label
              htmlFor="match-editor-id"
              className="app-label"
            >
              Código interno
            </label>

            <input
              id="match-editor-id"
              type="text"
              value={form.id}

              // O ID não pode ser alterado
              // durante uma edição.
              disabled={
                mode === 'edit' ||
                isSaving
              }

              onChange={
                (event) =>
                  updateField(
                    'id',
                    event.target.value
                  )
              }

              placeholder="m9"

              className="app-input disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="match-editor-group"
              className="app-label"
            >
              Grupo, fase ou rodada
            </label>

            <input
              id="match-editor-group"
              type="text"
              value={form.group}

              onChange={
                (event) =>
                  updateField(
                    'group',
                    event.target.value
                  )
              }

              placeholder="Grupo A, Oitavas, Quartas..."
              className="app-input"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Times e bandeiras */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Time A */}
          <div className="grid grid-cols-[72px_1fr] gap-3">
            <div>
              <label
                htmlFor="match-editor-flag-a"
                className="app-label"
              >
                Bandeira
              </label>

              <input
                id="match-editor-flag-a"
                type="text"
                value={form.flagA}

                onChange={
                  (event) =>
                    updateField(
                      'flagA',
                      event.target.value
                    )
                }

                placeholder="🇧🇷"
                className="app-input px-2 text-center"
                maxLength={8}
                disabled={isSaving}
              />
            </div>

            <div>
              <label
                htmlFor="match-editor-team-a"
                className="app-label"
              >
                Time A
              </label>

              <input
                id="match-editor-team-a"
                type="text"
                value={form.teamA}

                onChange={
                  (event) =>
                    updateField(
                      'teamA',
                      event.target.value
                    )
                }

                placeholder="Brasil"
                className="app-input"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Time B */}
          <div className="grid grid-cols-[72px_1fr] gap-3">
            <div>
              <label
                htmlFor="match-editor-flag-b"
                className="app-label"
              >
                Bandeira
              </label>

              <input
                id="match-editor-flag-b"
                type="text"
                value={form.flagB}

                onChange={
                  (event) =>
                    updateField(
                      'flagB',
                      event.target.value
                    )
                }

                placeholder="🇲🇦"
                className="app-input px-2 text-center"
                maxLength={8}
                disabled={isSaving}
              />
            </div>

            <div>
              <label
                htmlFor="match-editor-team-b"
                className="app-label"
              >
                Time B
              </label>

              <input
                id="match-editor-team-b"
                type="text"
                value={form.teamB}

                onChange={
                  (event) =>
                    updateField(
                      'teamB',
                      event.target.value
                    )
                }

                placeholder="Marrocos"
                className="app-input"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Data e horário */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="match-editor-date"
              className="app-label"
            >
              Data no Brasil
            </label>

            <input
              id="match-editor-date"
              type="date"
              value={form.date}

              onChange={
                (event) =>
                  updateField(
                    'date',
                    event.target.value
                  )
              }

              className="app-input"
              disabled={isSaving}
            />
          </div>

          <div>
            <label
              htmlFor="match-editor-time"
              className="app-label"
            >
              Horário no Brasil
            </label>

            <input
              id="match-editor-time"
              type="time"
              value={form.time}

              onChange={
                (event) =>
                  updateField(
                    'time',
                    event.target.value
                  )
              }

              className="app-input"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Estádio e cidade opcionais */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="match-editor-venue"
              className="app-label"
            >
              Estádio, opcional
            </label>

            <input
              id="match-editor-venue"
              type="text"
              value={form.venue}

              onChange={
                (event) =>
                  updateField(
                    'venue',
                    event.target.value
                  )
              }

              placeholder="Estádio"
              className="app-input"
              disabled={isSaving}
            />
          </div>

          <div>
            <label
              htmlFor="match-editor-city"
              className="app-label"
            >
              Cidade, opcional
            </label>

            <input
              id="match-editor-city"
              type="text"
              value={form.city}

              onChange={
                (event) =>
                  updateField(
                    'city',
                    event.target.value
                  )
              }

              placeholder="Cidade"
              className="app-input"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Aviso visual sobre
            a permissão administrativa */}
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />

          <p className="text-[11px] leading-relaxed text-emerald-900">
            Esta área aparece só para admin. Participantes comuns veem apenas
            os jogos publicados, os campos de palpite, o ranking e a
            conferência de palpites.
          </p>
        </div>

        {/* Botão principal */}
        <button
          type="submit"

          // Impede envio duplicado
          // e edição sem partidas existentes.
          disabled={
            isSaving ||
            editModeHasNoMatches
          }

          className="app-button-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          <span>
            {submitButtonText}
          </span>
        </button>
      </form>
    </section>
  );
}