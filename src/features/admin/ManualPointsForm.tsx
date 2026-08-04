import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import {
  SlidersHorizontal,
} from 'lucide-react';

import type {
  Player,
} from '../../types';

import {
  getManualAdjustmentText,
} from '../leaderboard/manualAdjustment';

// Define os dados e as funções
// recebidos do componente pai.
interface ManualPointsFormProps {
  // Lista dos participantes disponíveis
  // para receber um ajuste manual.
  players: Player[];

  // Função responsável por salvar
  // o ajuste manual do participante.
  //
  // Este componente prepara e valida o valor,
  // mas não acessa diretamente o banco.
  onUpdateManualAdjustment: (
    playerId: string,
    manualPointsAdjustment: number
  ) => void | Promise<void>;

  // Callback usado para mostrar
  // uma mensagem de sucesso.
  onSuccess: (
    message: string
  ) => void;

  // Callback usado para mostrar
  // uma mensagem de erro.
  onError: (
    message: string
  ) => void;
}

// Formulário administrativo usado
// para adicionar ou remover pontos manualmente
// da pontuação de um participante.
//
// O ajuste manual não substitui
// os pontos calculados pelos palpites.
//
// Ele é somado ao resultado automático:
//
// pontos finais = pontos dos palpites + ajuste manual
export function ManualPointsForm({
  players,
  onUpdateManualAdjustment,
  onSuccess,
  onError,
}: ManualPointsFormProps) {
  // Guarda o ID do participante
  // atualmente selecionado.
  //
  // Se já existir algum jogador
  // no primeiro carregamento,
  // começa selecionando o primeiro.
  const [
    selectedPlayerId,
    setSelectedPlayerId,
  ] = useState(
    players[0]?.id ?? ''
  );

  // Guarda o valor digitado no input.
  //
  // Inputs HTML trabalham com texto,
  // mesmo quando possuem type="number".
  //
  // Por isso o estado começa como string.
  const [
    manualPointsAdjustment,
    setManualPointsAdjustment,
  ] = useState('0');

  // Indica se o ajuste
  // está sendo salvo.
  //
  // Enquanto for true,
  // os campos e o botão ficam desabilitados.
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  // Procura, na lista de jogadores,
  // aquele que possui o ID selecionado.
  //
  // useMemo guarda o resultado
  // enquanto players e selectedPlayerId
  // não forem alterados.
  const selectedPlayer =
    useMemo(
      () =>
        players.find(
          (player) =>
            player.id ===
            selectedPlayerId
        ),

      [
        players,
        selectedPlayerId,
      ]
    );

  // Mantém o formulário sincronizado
  // com a lista de jogadores.
  //
  // Esse efeito executa quando:
  // - a lista de players muda;
  // - o participante selecionado muda.
  useEffect(() => {
    // Se não existem jogadores,
    // limpa a seleção e volta o ajuste para zero.
    if (players.length === 0) {
      setSelectedPlayerId('');

      setManualPointsAdjustment(
        '0'
      );

      return;
    }

    // Se o ID selecionado ainda existe,
    // mantém esse jogador.
    //
    // Caso ele tenha sido removido da lista,
    // seleciona o primeiro jogador disponível.
    const nextPlayer =
      selectedPlayer ??
      players[0];

    setSelectedPlayerId(
      nextPlayer.id
    );

    // Coloca no input o ajuste manual
    // atualmente salvo no jogador.
    //
    // O operador ?? usa zero somente
    // quando o valor for null ou undefined.
    //
    // Valores negativos continuam válidos.
    setManualPointsAdjustment(
      String(
        nextPlayer
          .manualPointsAdjustment ??
        0
      )
    );
  }, [
    players,
    selectedPlayer,
  ]);

  // Prepara o texto usado para informar
  // o ajuste atual do participante.
  //
  // A função pode retornar uma string vazia
  // quando não existe ajuste para mostrar.
  const currentAdjustmentText =
    selectedPlayer
      ? getManualAdjustmentText(
          selectedPlayer
        )
      : '';

  // Executa quando o formulário é enviado.
  const handleSubmit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    // Impede o comportamento padrão
    // do formulário, que recarregaria a página.
    event.preventDefault();

    // Não permite salvar sem um jogador válido.
    if (!selectedPlayer) {
      onError(
        'Selecione um participante para ajustar.'
      );

      return;
    }

    // O estado do input é uma string.
    //
    // Number transforma o texto
    // em um valor numérico.
    //
    // Quando o campo estiver vazio,
    // utiliza zero.
    const nextAdjustment =
      Number(
        manualPointsAdjustment ||
        0
      );

    // Number.isFinite rejeita:
    // - NaN;
    // - Infinity;
    // - -Infinity.
    //
    // Number.isInteger rejeita
    // valores com casas decimais.
    if (
      !Number.isFinite(
        nextAdjustment
      ) ||
      !Number.isInteger(
        nextAdjustment
      )
    ) {
      onError(
        'Use um número inteiro para o ajuste de pontos.'
      );

      return;
    }

    try {
      // Bloqueia o formulário
      // enquanto o salvamento acontece.
      setIsSaving(true);

      // Envia o ID do participante
      // e o valor numérico validado
      // para a função recebida do componente pai.
      await onUpdateManualAdjustment(
        selectedPlayer.id,
        nextAdjustment
      );

      onSuccess(
        `Ajuste de ${selectedPlayer.name} salvo no banco.`
      );
    } catch (error) {
      // Mantém o erro completo no console
      // para auxiliar durante o desenvolvimento.
      console.warn(
        'Erro ao salvar ajuste manual:',
        error
      );

      // Mostra uma mensagem mais simples
      // para o usuário.
      onError(
        'Não foi possível salvar o ajuste de pontos agora.'
      );
    } finally {
      // Executa tanto em caso de sucesso
      // quanto em caso de erro.
      //
      // Libera novamente o formulário.
      setIsSaving(false);
    }
  };

  // Renderização alternativa exibida
  // quando ainda não existem participantes.
  //
  // Como não existe ninguém para selecionar,
  // o formulário completo não é mostrado.
  if (players.length === 0) {
    return (
      <section className="app-card app-card-padding">
        <h3 className="text-lg font-bold text-slate-800">
          Ajuste manual de pontos
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Nenhum participante cadastrado ainda.
        </p>
      </section>
    );
  }

  return (
    // Card principal do formulário.
    <section className="app-card app-card-padding space-y-5">
      {/* Cabeçalho do card */}
      <div className="app-card-header">
        <SlidersHorizontal className="h-5 w-5 text-blue-600" />

        <h3 className="app-section-title">
          Ajuste manual de pontos
        </h3>
      </div>

      {/* O envio do formulário
          executa handleSubmit. */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Seleção do participante */}
        <div>
          <label
            htmlFor="manual-points-player"
            className="app-label"
          >
            Participante
          </label>

          {/* Select controlado pelo estado
              selectedPlayerId. */}
          <select
            id="manual-points-player"
            value={selectedPlayerId}

            onChange={
              (event) =>
                setSelectedPlayerId(
                  event.target.value
                )
            }

            className="app-select"
            disabled={isSaving}
          >
            {/* map transforma cada participante
                em uma opção do select. */}
            {players.map(
              (player) => (
                <option
                  key={player.id}
                  value={player.id}
                >
                  {player.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* Campo do ajuste manual */}
        <div>
          <label
            htmlFor="manual-points-value"
            className="app-label"
          >
            Pontos manuais
          </label>

          <input
            id="manual-points-value"
            type="number"

            // Sugere ao navegador
            // incrementos de números inteiros.
            //
            // A validação real também acontece
            // dentro de handleSubmit.
            step="1"

            // Input controlado pelo estado.
            value={
              manualPointsAdjustment
            }

            onChange={
              (event) =>
                setManualPointsAdjustment(
                  event.target.value
                )
            }

            className="app-input"
            disabled={isSaving}
          />
        </div>

        {/* Renderização condicional:
            essa explicação só aparece
            quando existe um jogador selecionado. */}
        {selectedPlayer && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-800">
            <p>
              Pontos calculados por palpites continuam automáticos. Este campo
              soma ou subtrai pontos extras no ranking.
            </p>

            {/* Mostra o ajuste atual somente
                quando getManualAdjustmentText
                devolve um texto com conteúdo. */}
            {currentAdjustmentText && (
              <p className="mt-2 text-blue-700">
                Atual:{' '}
                {
                  currentAdjustmentText
                }
              </p>
            )}
          </div>
        )}

        {/* Botão que envia o formulário */}
        <button
          type="submit"
          disabled={isSaving}
          className="app-button-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SlidersHorizontal className="h-4 w-4" />

          <span>
            {/* O texto muda enquanto
                o salvamento está acontecendo. */}
            {isSaving
              ? 'Salvando ajuste...'
              : 'Salvar ajuste de pontos'}
          </span>
        </button>
      </form>
    </section>
  );
}