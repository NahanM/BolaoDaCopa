import { useState } from 'react';

import type {
  FormEvent,
} from 'react';

import {
  Plus,
  Sparkles,
} from 'lucide-react';

import {
  AVAILABLE_AVATARS,
  DEFAULT_AVATAR,
} from '../../config/avatars';

import type {
  Match,
  Prediction,
} from '../../types';

import type {
  NewPlayerPredictions,
  ScoreInputValue,
} from './types';

// Define quais informações e funções
// o componente recebe do componente pai.
interface AddPlayerFormProps {
  // Partidas que serão exibidas
  // para o preenchimento dos palpites iniciais.
  matches: Match[];

  // Função responsável por cadastrar
  // o participante de verdade.
  //
  // Este componente apenas prepara os dados.
  // A gravação no banco acontece fora dele.
  onAddPlayer: (
    name: string,
    avatar: string,
    predictions: Record<string, Prediction>
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
// para cadastrar um novo participante.
//
// O componente permite:
// - informar o nome;
// - escolher um avatar;
// - adicionar palpites iniciais opcionais;
// - enviar os dados para o componente pai.
export function AddPlayerForm({
  matches,
  onAddPlayer,
  onSuccess,
  onError,
}: AddPlayerFormProps) {
  // Guarda o nome digitado no formulário.
  const [
    newPlayerName,
    setNewPlayerName,
  ] = useState('');

  // Guarda o avatar selecionado.
  //
  // O formulário começa utilizando
  // o avatar padrão do sistema.
  const [
    newPlayerAvatar,
    setNewPlayerAvatar,
  ] = useState(DEFAULT_AVATAR);

  // Guarda os palpites enquanto
  // ainda estão sendo digitados.
  //
  // A chave do objeto é o ID da partida.
  //
  // Exemplo:
  //
  // {
  //   "match-1": {
  //     scoreA: 2,
  //     scoreB: 1
  //   }
  // }
  const [
    newPlayerPreds,
    setNewPlayerPreds,
  ] = useState<NewPlayerPredictions>({});

  // Indica se o cadastro está sendo salvo.
  //
  // Enquanto for true, inputs e botão
  // ficam desabilitados para evitar
  // envios duplicados.
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  // Atualiza o placar digitado
  // para uma partida específica.
  //
  // matchId:
  // identifica qual partida será alterada.
  //
  // side:
  // informa se o valor pertence ao time A ou B.
  //
  // value:
  // texto recebido diretamente do input.
  const setPredValue = (
    matchId: string,
    side: 'A' | 'B',
    value: string
  ) => {
    // Remove tudo que não seja número.
    //
    // Depois limita o valor a dois dígitos.
    //
    // Exemplos:
    // "a1b2" vira "12"
    // "123" vira "12"
    const cleanValue =
      value
        .replace(
          /[^0-9]/g,
          ''
        )
        .slice(
          0,
          2
        );

    // O input pode guardar:
    // - uma string vazia, quando não foi preenchido;
    // - um número, quando possui placar.
    const numberValue:
      ScoreInputValue =
        cleanValue === ''
          ? ''
          : Number(cleanValue);

    // Utiliza a versão funcional do setState
    // para sempre trabalhar com o estado
    // mais recente dos palpites.
    setNewPlayerPreds(
      (currentPredictions) => ({
        // Mantém os palpites
        // das outras partidas.
        ...currentPredictions,

        // [matchId] é uma propriedade dinâmica.
        //
        // Se matchId for "match-10",
        // esta propriedade será:
        //
        // "match-10": { ... }
        [matchId]: {
          // Quando o lado alterado é A,
          // utiliza o novo valor.
          //
          // Caso contrário, mantém o valor anterior
          // do time A ou utiliza string vazia.
          scoreA:
            side === 'A'
              ? numberValue
              : (
                  currentPredictions[
                    matchId
                  ]?.scoreA ?? ''
                ),

          // Quando o lado alterado é B,
          // utiliza o novo valor.
          //
          // Caso contrário, mantém o valor anterior
          // do time B ou utiliza string vazia.
          scoreB:
            side === 'B'
              ? numberValue
              : (
                  currentPredictions[
                    matchId
                  ]?.scoreB ?? ''
                ),
        },
      })
    );
  };

  // Executa quando o formulário é enviado.
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    // Impede que o navegador recarregue
    // a página ao enviar o formulário.
    event.preventDefault();

    // Remove espaços do nome
    // e verifica se ainda existe conteúdo.
    if (!newPlayerName.trim()) {
      onError(
        'Digite um nome para o participante.'
      );

      // Interrompe o envio.
      return;
    }

    // Objeto que receberá somente
    // os palpites preparados para serem salvos.
    const preparedPredictions:
      Record<string, Prediction> = {};

    // Cria uma única data para todos os palpites
    // cadastrados nesta operação.
    const savedAt =
      new Date().toISOString();

    // Percorre todas as partidas recebidas.
    matches.forEach(
      (match) => {
        // Procura o palpite digitado
        // para a partida atual.
        const prediction =
          newPlayerPreds[match.id];

        const scoreAValue =
          prediction?.scoreA;

        const scoreBValue =
          prediction?.scoreB;

        // O placar é considerado preenchido
        // quando não é undefined
        // e não é uma string vazia.
        //
        // O valor 0 continua sendo válido.
        const hasScoreA =
          scoreAValue !== undefined &&
          scoreAValue !== '';

        const hasScoreB =
          scoreBValue !== undefined &&
          scoreBValue !== '';

        // Só cria o palpite quando pelo menos
        // um dos dois placares foi preenchido.
        if (
          hasScoreA ||
          hasScoreB
        ) {
          preparedPredictions[
            match.id
          ] = {
            // Caso apenas um dos lados
            // tenha sido preenchido,
            // o outro lado será salvo como zero.
            scoreA:
              hasScoreA
                ? Number(scoreAValue)
                : 0,

            scoreB:
              hasScoreB
                ? Number(scoreBValue)
                : 0,

            createdAt: savedAt,
            updatedAt: savedAt,
          };
        }
      }
    );

    // Nome final sem espaços
    // no começo ou no final.
    const playerName =
      newPlayerName.trim();

    try {
      // Bloqueia o formulário
      // enquanto o cadastro acontece.
      setIsSaving(true);

      // Envia os dados preparados
      // para a função recebida do componente pai.
      await onAddPlayer(
        playerName,
        newPlayerAvatar,
        preparedPredictions
      );

      // Limpa o formulário somente
      // depois de um cadastro bem-sucedido.
      setNewPlayerName('');

      setNewPlayerAvatar(
        DEFAULT_AVATAR
      );

      setNewPlayerPreds({});

      onSuccess(
        `Participante ${playerName} adicionado. ` +
        'R$10,00 somados à premiação.'
      );
    } catch (error) {
      // O erro completo fica no console
      // para ajudar durante o desenvolvimento.
      console.warn(
        'Erro ao adicionar participante:',
        error
      );

      // O usuário recebe uma mensagem
      // mais simples e compreensível.
      onError(
        'Não foi possível salvar o participante no banco agora.'
      );
    } finally {
      // Executa tanto em sucesso quanto em erro.
      //
      // Libera novamente o formulário.
      setIsSaving(false);
    }
  };

  return (
    // Em JSX, comentários dentro da marcação
    // precisam ser escritos usando:
    //
    // {/* comentário */}
    <section className="app-card app-card-padding space-y-5">
      {/* Cabeçalho do card */}
      <div className="app-card-header">
        <Plus className="w-5 h-5 text-emerald-600" />

        <h3 className="app-section-title">
          Registrar novo participante
        </h3>
      </div>

      {/* Ao enviar o formulário,
          handleSubmit será executado. */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Área com nome e avatar.
            No celular possui uma coluna.
            Em telas maiores possui três colunas. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* O campo de nome ocupa duas
              das três colunas em telas maiores. */}
          <div className="sm:col-span-2">
            <label
              htmlFor="new-player-name"
              className="app-label"
            >
              Nome do participante
            </label>

            {/* Input controlado:
                seu valor vem do estado newPlayerName.

                Cada alteração chama setNewPlayerName
                e atualiza o estado. */}
            <input
              id="new-player-name"
              type="text"
              value={newPlayerName}
              onChange={
                (event) =>
                  setNewPlayerName(
                    event.target.value
                  )
              }
              placeholder="Ex: Carlos Silva"
              className="app-input"
              disabled={isSaving}
            />
          </div>

          <div>
            <label
              htmlFor="new-player-avatar"
              className="app-label"
            >
              Avatar
            </label>

            {/* Select controlado pelo estado
                newPlayerAvatar. */}
            <select
              id="new-player-avatar"
              value={newPlayerAvatar}
              onChange={
                (event) =>
                  setNewPlayerAvatar(
                    event.target.value
                  )
              }
              className="app-select text-center px-2 py-2.5"
              disabled={isSaving}
            >
              {/* map transforma cada avatar
                  em uma opção do select. */}
              {AVAILABLE_AVATARS.map(
                (avatar) => (
                  <option
                    key={avatar}
                    value={avatar}
                  >
                    {avatar}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Área dos palpites iniciais */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
            Palpites iniciais, opcional
          </label>

          <p className="text-[11px] text-slate-400">
            Se deixar em branco, o participante entra sem palpites cadastrados.
          </p>

          {/* Caixa com altura máxima e rolagem.
              Cada partida será transformada
              em uma linha através do map. */}
          <div className="max-h-[240px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1 space-y-1">
            {matches.map(
              (match) => {
                // Obtém o valor que está sendo digitado
                // para esta partida específica.
                const currentPrediction =
                  newPlayerPreds[match.id];

                return (
                  <div
                    key={match.id}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-xs"
                  >
                    {/* Informações do time A */}
                    <span className="font-semibold text-slate-600 flex items-center gap-1 min-w-0">
                      <span>
                        {match.flagA}
                      </span>

                      <span className="truncate">
                        {match.teamA}
                      </span>
                    </span>

                    {/* Campos de placar */}
                    <div className="flex items-center gap-2">
                      {/* Placar do time A */}
                      <input
                        type="text"

                        // Sugere teclado numérico
                        // em dispositivos móveis.
                        inputMode="numeric"

                        // Informa que o campo
                        // espera somente números.
                        pattern="[0-9]*"
                        placeholder="0"

                        // Caso ainda não exista scoreA,
                        // mostra string vazia.
                        //
                        // O operador ?? preserva o número 0.
                        value={
                          currentPrediction
                            ?.scoreA ?? ''
                        }

                        onChange={
                          (event) =>
                            setPredValue(
                              match.id,
                              'A',
                              event.target.value
                            )
                        }

                        className="w-10 text-center border border-slate-200 bg-white rounded py-1 font-bold focus:ring-1 focus:ring-emerald-500"
                        disabled={isSaving}
                      />

                      <span className="text-slate-400 font-bold font-mono">
                        x
                      </span>

                      {/* Placar do time B */}
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"

                        value={
                          currentPrediction
                            ?.scoreB ?? ''
                        }

                        onChange={
                          (event) =>
                            setPredValue(
                              match.id,
                              'B',
                              event.target.value
                            )
                        }

                        className="w-10 text-center border border-slate-200 bg-white rounded py-1 font-bold focus:ring-1 focus:ring-emerald-500"
                        disabled={isSaving}
                      />
                    </div>

                    {/* Informações do time B */}
                    <span className="font-semibold text-slate-600 flex items-center gap-1 justify-end min-w-0">
                      <span className="truncate">
                        {match.teamB}
                      </span>

                      <span>
                        {match.flagB}
                      </span>
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Botão responsável por enviar o formulário */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />

          <span>
            {/* O texto muda conforme
                o estado de salvamento. */}
            {isSaving
              ? 'Salvando participante...'
              : (
                  `Adicionar ${
                    newPlayerName.trim() ||
                    'novo participante'
                  } - R$ 10`
                )}
          </span>
        </button>
      </form>
    </section>
  );
}