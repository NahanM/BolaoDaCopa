import {
  useEffect,
  useState,
} from 'react';

import type {
  ChangeEvent,
  FormEvent,
} from 'react';

import {
  Save,
  Trophy,
} from 'lucide-react';

import type {
  Match,
} from '../../types';

import type {
  ScoreInputValue,
} from './types';

import {
  AdminRuleNotice,
} from './AdminRuleNotice';

// Define os dados e as funções
// recebidos do componente pai.
interface MatchResultFormProps {
  // Lista de partidas disponíveis
  // para lançamento ou alteração de resultado.
  matches: Match[];

  // Função responsável por salvar
  // o placar e o status da partida.
  //
  // Este componente prepara os valores,
  // mas não acessa diretamente o banco.
  onUpdateMatchResult: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    status:
      'scheduled' | 'finished'
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

// Formulário administrativo usado
// para lançar o resultado de uma partida.
//
// O componente permite:
//
// - selecionar uma partida;
// - informar o placar dos dois times;
// - finalizar ou reabrir a partida;
// - enviar o resultado para o componente pai.
export function MatchResultForm({
  matches,
  onUpdateMatchResult,
  onSuccess,
  onError,
}: MatchResultFormProps) {
  // Guarda o ID da partida selecionada.
  //
  // Caso já exista alguma partida,
  // começa utilizando a primeira da lista.
  const [
    selectedMatchId,
    setSelectedMatchId,
  ] = useState(
    matches[0]?.id ?? ''
  );

  // Guarda o placar digitado
  // para o time A.
  //
  // ScoreInputValue permite
  // um número ou uma string vazia.
  const [
    scoreA,
    setScoreA,
  ] = useState<ScoreInputValue>(
    ''
  );

  // Guarda o placar digitado
  // para o time B.
  const [
    scoreB,
    setScoreB,
  ] = useState<ScoreInputValue>(
    ''
  );

  // Indica se a partida será marcada
  // como finalizada ao salvar.
  //
  // Começa como true,
  // portanto o comportamento padrão
  // é finalizar a partida.
  const [
    finishMatchState,
    setFinishMatchState,
  ] = useState(true);

  // Indica se o resultado
  // está sendo salvo.
  //
  // Enquanto for true,
  // os campos e o botão ficam bloqueados.
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  // Mantém o ID selecionado válido
  // quando a lista de partidas muda.
  useEffect(() => {
    // Se não existem partidas,
    // limpa a seleção.
    if (matches.length === 0) {
      setSelectedMatchId('');

      return;
    }

    // Verifica se a partida selecionada
    // ainda existe na lista recebida.
    const selectedMatchStillExists =
      matches.some(
        (match) =>
          match.id ===
          selectedMatchId
      );

    // Quando não existe uma seleção
    // ou a partida selecionada foi removida,
    // utiliza a primeira partida disponível.
    if (
      !selectedMatchId ||
      !selectedMatchStillExists
    ) {
      setSelectedMatchId(
        matches[0].id
      );
    }
  }, [
    matches,
    selectedMatchId,
  ]);

  // Procura a partida selecionada
  // dentro da lista.
  //
  // Caso o ID ainda não seja encontrado,
  // utiliza temporariamente a primeira partida.
  const selectedMatch =
    matches.find(
      (match) =>
        match.id ===
        selectedMatchId
    ) ?? matches[0];

  // Sincroniza os campos do formulário
  // com os dados da partida selecionada.
  function syncFormWithMatch(
    match: Match | undefined
  ) {
    // Se a partida já estiver finalizada,
    // carrega o placar salvo.
    if (
      match?.status === 'finished'
    ) {
      setScoreA(
        match.scoreA ?? 0
      );

      setScoreB(
        match.scoreB ?? 0
      );

      setFinishMatchState(true);

      return;
    }

    // Partidas ainda não finalizadas
    // começam com os campos vazios.
    setScoreA('');
    setScoreB('');

    // O checkbox volta marcado
    // para que o salvamento finalize
    // a partida por padrão.
    setFinishMatchState(true);
  }

  // Atualiza o formulário quando
  // a partida selecionada ou seu resultado mudam.
  useEffect(() => {
    syncFormWithMatch(
      selectedMatch
    );
  }, [
    selectedMatch?.id,
    selectedMatch?.scoreA,
    selectedMatch?.scoreB,
    selectedMatch?.status,
  ]);

  // Executa quando o administrador
  // escolhe outra partida no select.
  const handleMatchChange = (
    event:
      ChangeEvent<HTMLSelectElement>
  ) => {
    const id =
      event.target.value;

    const match =
      matches.find(
        (item) =>
          item.id === id
      );

    // Atualiza o ID selecionado.
    setSelectedMatchId(id);

    // Preenche imediatamente os campos
    // com os dados da nova partida.
    syncFormWithMatch(match);
  };

  // Executa quando o formulário
  // é enviado.
  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    // Impede o recarregamento
    // padrão da página.
    event.preventDefault();

    // Sem uma partida selecionada,
    // não existe resultado para salvar.
    if (!selectedMatchId) {
      return;
    }

    // Os estados podem guardar
    // número ou string vazia.
    //
    // Quando um valor estiver vazio,
    // utiliza zero.
    //
    // Na interface, os inputs possuem required,
    // então normalmente o navegador impede
    // o envio com os campos vazios.
    const finalScoreA =
      scoreA === ''
        ? 0
        : Number(scoreA);

    const finalScoreB =
      scoreB === ''
        ? 0
        : Number(scoreB);

    try {
      // Bloqueia o formulário
      // durante o salvamento.
      setIsSaving(true);

      // Envia o ID, os placares
      // e o status escolhido.
      await onUpdateMatchResult(
        selectedMatchId,
        finalScoreA,
        finalScoreB,

        finishMatchState
          ? 'finished'
          : 'scheduled'
      );

      onSuccess(
        'Resultado salvo. ' +
        'O ranking foi recalculado automaticamente.'
      );
    } catch (error) {
      // Mantém o erro completo no console
      // para auxiliar durante o desenvolvimento.
      console.warn(
        'Erro ao salvar resultado:',
        error
      );

      // Exibe uma mensagem mais simples
      // para o administrador.
      onError(
        'Não foi possível salvar ' +
        'o resultado no banco agora.'
      );
    } finally {
      // Executa tanto em sucesso
      // quanto em erro.
      //
      // Libera novamente o formulário.
      setIsSaving(false);
    }
  };

  // Quando não existem partidas,
  // mostra apenas um estado vazio.
  if (matches.length === 0) {
    return (
      <section className="app-card app-card-padding">
        <h3 className="text-lg font-bold text-slate-800">
          Lançar resultado
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Nenhuma partida cadastrada ainda.
        </p>
      </section>
    );
  }

  return (
    // Card principal do formulário.
    <section className="app-card app-card-padding space-y-6">
      {/* Cabeçalho do card */}
      <div className="app-card-header">
        <Trophy className="h-5 w-5 text-amber-500" />

        <h3 className="app-section-title">
          Lançar resultado de partida
        </h3>
      </div>

      {/* Formulário de resultado */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Seleção da partida */}
        <div>
          <label
            htmlFor="match-result-selected-match"
            className="app-label"
          >
            Selecione a partida
          </label>

          <select
            id="match-result-selected-match"
            value={selectedMatchId}
            onChange={handleMatchChange}
            className="app-select"
            disabled={isSaving}
          >
            {/* Transforma cada partida
                em uma opção do select. */}
            {matches.map(
              (match) => (
                <option
                  key={match.id}
                  value={match.id}
                >
                  [{match.group}]{' '}
                  {match.flagA}{' '}
                  {match.teamA}{' '}
                  x{' '}
                  {match.teamB}{' '}
                  {match.flagB}{' '}
                  - {match.date}{' '}
                  (
                  {match.status ===
                  'finished'
                    ? 'Finalizado'
                    : 'Aguardando'}
                  )
                  {match.city
                    ? ` - ${match.city}`
                    : ''}
                </option>
              )
            )}
          </select>
        </div>

        {/* Exibe os dados e os campos
            da partida selecionada. */}
        {selectedMatch && (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {/* Grupo, fase ou rodada */}
            <span className="rounded bg-slate-200/60 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
              {selectedMatch.group}
            </span>

            {/* Times e placares */}
            <div className="flex w-full items-center justify-center gap-6">
              {/* Time A */}
              <div className="flex flex-1 flex-col items-center text-center">
                <span className="mb-1 text-3xl drop-shadow">
                  {selectedMatch.flagA}
                </span>

                <span className="max-w-[120px] truncate text-xs font-semibold text-slate-800">
                  {selectedMatch.teamA}
                </span>

                {/* Input controlado do placar A */}
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="--"
                  value={scoreA}

                  aria-label={
                    `Placar de ${selectedMatch.teamA}`
                  }

                  onChange={
                    (event) =>
                      setScoreA(
                        event.target.value === ''
                          ? ''
                          : Number(
                              event.target.value
                            )
                      )
                  }

                  className="mt-2 w-16 rounded-lg border border-slate-200 bg-white py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Separador visual */}
              <div className="text-xl font-black text-slate-400">
                X
              </div>

              {/* Time B */}
              <div className="flex flex-1 flex-col items-center text-center">
                <span className="mb-1 text-3xl drop-shadow">
                  {selectedMatch.flagB}
                </span>

                <span className="max-w-[120px] truncate text-xs font-semibold text-slate-800">
                  {selectedMatch.teamB}
                </span>

                {/* Input controlado do placar B */}
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="--"
                  value={scoreB}

                  aria-label={
                    `Placar de ${selectedMatch.teamB}`
                  }

                  onChange={
                    (event) =>
                      setScoreB(
                        event.target.value === ''
                          ? ''
                          : Number(
                              event.target.value
                            )
                      )
                  }

                  className="mt-2 w-16 rounded-lg border border-slate-200 bg-white py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Controle do status da partida */}
            <div className="flex items-center gap-4 pt-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={
                    finishMatchState
                  }

                  onChange={
                    (event) =>
                      setFinishMatchState(
                        event.target.checked
                      )
                  }

                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={isSaving}
                />

                <span>
                  Finalizar partida e calcular pontos
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Botão que envia o resultado */}
        <button
          type="submit"
          disabled={isSaving}
          className="app-button-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          <span>
            {isSaving
              ? 'Salvando resultado...'
              : 'Salvar resultado oficial'}
          </span>
        </button>
      </form>

      {/* Aviso visual sobre
          o prazo dos palpites. */}
      <AdminRuleNotice />
    </section>
  );
}