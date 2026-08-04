/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type {
  Match,
  Player,
} from '../types';

import {
  BulkPredictionActions,
} from '../features/matches/BulkPredictionActions';

import {
  MatchCard,
} from '../features/matches/MatchCard';

import type {
  PredictionSaveStatus,
} from '../features/matches/MatchCard';

import {
  MatchDetailsModal,
} from '../features/matches/MatchDetailsModal';

import {
  MatchFilterTabs,
} from '../features/matches/MatchFilterTabs';

import {
  buildAllPredictionsClipboardText,
  buildAllPredictionsWhatsAppText,
  buildSinglePredictionWhatsAppText,
} from '../features/matches/shareText';

import {
  getFilteredMatches,
} from '../domain/matchFilters';

import {
  getPredictionLockMessage,
  isPredictionLocked,
} from '../domain/rules';

import type {
  MatchFilter,
  PredictionSide,
} from '../features/matches/types';

type EditedPredictions = Record<
  string,
  {
    scoreA: string;
    scoreB: string;
  }
>;

type ToastType =
  | 'success'
  | 'info'
  | 'error';

interface ToastState {
  message: string;
  type: ToastType;
}

interface MatchesListProps {
  matches: Match[];
  players: Player[];
  userPlayer: Player;
  canEdit: boolean;

  onUpdatePrediction: (
    matchId: string,
    scoreA: number,
    scoreB: number
  ) => void | Promise<void>;
}

const MATCHES_PAGE_SIZE = 24;
const TOAST_DURATION_MS = 4000;

// Aplica a mesma regra de limpeza
// utilizada pelos campos de placar.
//
// Manter a validação também neste nível
// protege o estado mesmo que outro componente
// chame handleInputChange futuramente.
function sanitizeScore(
  value: string
): string {
  return value
    .replace(/[^0-9]/g, '')
    .slice(0, 2);
}

export function MatchesList({
  matches,
  players,
  userPlayer,
  canEdit,
  onUpdatePrediction,
}: MatchesListProps) {
  // Filtro atualmente selecionado.
  const [
    activeFilter,
    setActiveFilter,
  ] = useState<MatchFilter>(
    'open'
  );

  // Página atual da lista filtrada.
  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  // Alterações feitas nos campos
  // que ainda não foram necessariamente salvas.
  const [
    editedPreds,
    setEditedPreds,
  ] = useState<EditedPredictions>({});

  // Guarda somente o ID da partida aberta.
  //
  // A partida atual será derivada de matches,
  // evitando manter um objeto antigo no modal.
  const [
    selectedMatchId,
    setSelectedMatchId,
  ] = useState<string | null>(
    null
  );

  // Estado de salvamento separado
  // para cada partida.
  const [
    predictionSaveStatuses,
    setPredictionSaveStatuses,
  ] = useState<
    Record<string, PredictionSaveStatus>
  >({});

  const [
    toast,
    setToast,
  ] = useState<ToastState | null>(
    null
  );

  // Temporizador do toast atual.
  const toastTimeoutRef =
  useRef<number | null>(null);

  // Cada partida pode possuir
  // seu próprio temporizador de status.
 const predictionStatusTimersRef =
  useRef<Record<string, number>>({});

  // Proteção contra dois salvamentos
  // simultâneos para a mesma partida.
  const savingMatchIdsRef =
    useRef(
      new Set<string>()
    );

  // Cancela temporizadores caso
  // o componente seja desmontado.
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(
          toastTimeoutRef.current
        );
      }

      Object
        .values(
          predictionStatusTimersRef.current
        )
        .forEach(
          (timerId) =>
            window.clearTimeout(
              timerId
            )
        );
    };
  }, []);

  const triggerToast = (
    message: string,
    type: ToastType = 'success'
  ) => {
    // Evita que o temporizador
    // de uma mensagem antiga apague
    // um toast mais recente.
    if (toastTimeoutRef.current) {
      window.clearTimeout(
        toastTimeoutRef.current
      );
    }

    setToast({
      message,
      type,
    });

    toastTimeoutRef.current =
      window.setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, TOAST_DURATION_MS);
  };

  // Atualiza o estado visual
  // de uma partida e, opcionalmente,
  // agenda o retorno para idle.
  const setPredictionSaveStatus = (
    matchId: string,
    status: PredictionSaveStatus,
    resetAfterMs?: number
  ) => {
    const existingTimer =
      predictionStatusTimersRef
        .current[matchId];

    if (existingTimer) {
      window.clearTimeout(
        existingTimer
      );

      delete predictionStatusTimersRef
        .current[matchId];
    }

    setPredictionSaveStatuses(
      (currentStatuses) => ({
        ...currentStatuses,
        [matchId]: status,
      })
    );

    if (resetAfterMs) {
      predictionStatusTimersRef
        .current[matchId] =
        window.setTimeout(() => {
          setPredictionSaveStatuses(
            (currentStatuses) => ({
              ...currentStatuses,
              [matchId]: 'idle',
            })
          );

          delete predictionStatusTimersRef
            .current[matchId];
        }, resetAfterMs);
    }
  };

  const handleInputChange = (
    matchId: string,
    side: PredictionSide,
    value: string
  ) => {
    const cleanValue =
      sanitizeScore(value);

    // Ao editar novamente, remove estados
    // anteriores como saved ou error.
    setPredictionSaveStatus(
      matchId,
      'idle'
    );

    setEditedPreds(
      (currentPredictions) => ({
        ...currentPredictions,

        [matchId]: {
          scoreA:
            side === 'A'
              ? cleanValue
              : (
                  currentPredictions[
                    matchId
                  ]?.scoreA ??
                  userPlayer.predictions[
                    matchId
                  ]?.scoreA?.toString() ??
                  ''
                ),

          scoreB:
            side === 'B'
              ? cleanValue
              : (
                  currentPredictions[
                    matchId
                  ]?.scoreB ??
                  userPlayer.predictions[
                    matchId
                  ]?.scoreB?.toString() ??
                  ''
                ),
        },
      })
    );
  };

  const handleSavePrediction =
    async (
      matchId: string
    ) => {
      if (!canEdit) {
        triggerToast(
          'Entre com sua conta Google para salvar seus palpites.',
          'info'
        );

        return;
      }

      // Impede duas gravações simultâneas
      // para a mesma partida.
      if (
        savingMatchIdsRef
          .current
          .has(matchId)
      ) {
        return;
      }

      const targetMatch =
        matches.find(
          (match) =>
            match.id === matchId
        );

      if (!targetMatch) {
        triggerToast(
          'Partida não encontrada.',
          'info'
        );

        return;
      }

      // Revalida o bloqueio no momento
      // exato em que o usuário tenta salvar.
      if (
        isPredictionLocked(
          targetMatch
        )
      ) {
        triggerToast(
          getPredictionLockMessage(
            targetMatch
          ),
          'info'
        );

        return;
      }

      const inputState =
        editedPreds[matchId];

      if (!inputState) {
        triggerToast(
          'Altere o placar antes de salvar.',
          'info'
        );

        return;
      }

      // Regra atual:
      // campo vazio é convertido para zero.
      const scoreA =
        inputState.scoreA === ''
          ? 0
          : Number(
              inputState.scoreA
            );

      const scoreB =
        inputState.scoreB === ''
          ? 0
          : Number(
              inputState.scoreB
            );

      savingMatchIdsRef
        .current
        .add(matchId);

      setPredictionSaveStatus(
        matchId,
        'saving'
      );

      try {
        await onUpdatePrediction(
          matchId,
          scoreA,
          scoreB
        );

        // Depois do sucesso,
        // remove a alteração local.
        setEditedPreds(
          (currentPredictions) => {
            const nextPredictions = {
              ...currentPredictions,
            };

            delete nextPredictions[
              matchId
            ];

            return nextPredictions;
          }
        );

        setPredictionSaveStatus(
          matchId,
          'saved',
          2500
        );

        triggerToast(
          'Palpite salvo com sucesso.',
          'success'
        );
      } catch (error) {
        console.warn(
          'Erro ao confirmar palpite:',
          error
        );

        // A edição local é preservada,
        // permitindo uma nova tentativa.
        setPredictionSaveStatus(
          matchId,
          'error',
          4000
        );

        triggerToast(
          'Não foi possível salvar no banco. Tente novamente.',
          'error'
        );
      } finally {
        savingMatchIdsRef
          .current
          .delete(matchId);
      }
    };

  const handleShareMatchWhatsApp = (
    match: Match
  ) => {
    const text =
      buildSinglePredictionWhatsAppText({
        match,
        userPlayer,
        editedPreds,
      });

    window.open(
      `https://api.whatsapp.com/send?text=${
        encodeURIComponent(text)
      }`,
      '_blank'
    );
  };

  const handleShareAllWhatsApp =
    () => {
      // Usa todas as partidas recebidas,
      // não apenas as filtradas ou visíveis.
      const text =
        buildAllPredictionsWhatsAppText({
          matches,
          userPlayer,
          editedPreds,
          pageUrl:
            window.location.href,
        });

      window.open(
        `https://api.whatsapp.com/send?text=${
          encodeURIComponent(text)
        }`,
        '_blank'
      );

      triggerToast(
        'Abrindo compartilhamento no WhatsApp...',
        'info'
      );
    };

  const handleCopyClipboard =
    async () => {
      const text =
        buildAllPredictionsClipboardText({
          matches,
          userPlayer,
          editedPreds,
        });

      try {
        await navigator
          .clipboard
          .writeText(text);

        triggerToast(
          'Palpites copiados para a área de transferência.',
          'success'
        );
      } catch (error) {
        console.warn(
          'Erro ao copiar palpites:',
          error
        );

        triggerToast(
          'Não foi possível copiar agora. Tente novamente.',
          'error'
        );
      }
    };

  // Aplica a regra de filtragem
  // centralizada no domínio.
  const filteredMatches =
    useMemo(
      () =>
        getFilteredMatches(
          matches,
          userPlayer,
          activeFilter
        ),
      [
        activeFilter,
        matches,
        userPlayer,
      ]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMatches.length /
        MATCHES_PAGE_SIZE
      )
    );

  // Ao trocar o filtro ou mudar
  // a quantidade total de partidas,
  // volta para a primeira página.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeFilter,
    matches.length,
  ]);

  // Caso o filtro diminua sem alterar
  // matches.length, mantém a página
  // dentro do novo limite.
  useEffect(() => {
    setCurrentPage(
      (page) =>
        Math.min(
          page,
          totalPages
        )
    );
  }, [totalPages]);

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const firstVisibleMatchIndex =
    (
      safeCurrentPage - 1
    ) * MATCHES_PAGE_SIZE;

  const visibleMatches =
    filteredMatches.slice(
      firstVisibleMatchIndex,
      firstVisibleMatchIndex +
        MATCHES_PAGE_SIZE
    );

  const visibleStart =
    filteredMatches.length === 0
      ? 0
      : firstVisibleMatchIndex + 1;

  const visibleEnd =
    Math.min(
      firstVisibleMatchIndex +
        visibleMatches.length,
      filteredMatches.length
    );

  // Deriva a versão atualizada
  // da partida selecionada.
  const selectedMatchDetails =
    selectedMatchId
      ? (
          matches.find(
            (match) =>
              match.id ===
              selectedMatchId
          ) ?? null
        )
      : null;

  const hasMatches =
    matches.length > 0;

  const hasFilteredMatches =
    filteredMatches.length > 0;

  return (
    <div
      id="matches-section"
      className="relative space-y-6"
    >
      {/* Feedback temporário.

          bottom-20 no celular evita
          sobreposição com a navegação inferior. */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-white shadow-2xl animate-slide-up md:bottom-6 md:right-6"
        >
          <div
            aria-hidden="true"
            className={
              `h-2.5 w-2.5 rounded-full ${
                toast.type === 'success'
                  ? 'bg-emerald-400'
                  : toast.type === 'error'
                    ? 'bg-red-400'
                    : 'bg-blue-400'
              }`
            }
          />

          <span className="text-xs font-bold">
            {toast.message}
          </span>
        </div>
      )}

      {/* Modal de detalhes da partida */}
      {selectedMatchDetails && (
        <MatchDetailsModal
          match={selectedMatchDetails}
          players={players}
          onClose={
            () =>
              setSelectedMatchId(
                null
              )
          }
        />
      )}

      {/* Filtros e ações em massa */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <MatchFilterTabs
          matches={matches}
          userPlayer={userPlayer}
          activeFilter={activeFilter}
          onChangeFilter={
            setActiveFilter
          }
        />

        {/* Evita copiar ou compartilhar
            uma lista totalmente vazia. */}
        {hasMatches && (
          <BulkPredictionActions
            onCopyAll={
              handleCopyClipboard
            }
            onShareAllWhatsApp={
              handleShareAllWhatsApp
            }
          />
        )}
      </div>

      {!hasMatches ? (
        <div className="app-card app-card-padding text-sm text-slate-600">
          Nenhuma partida cadastrada ainda. O administrador pode recriar a
          tabela inicial pelo Painel ADM.
        </div>
      ) : !hasFilteredMatches ? (
        <div className="app-card app-card-padding text-sm text-slate-600">
          Nenhuma partida encontrada para este filtro. Use “Todos” para ver a
          lista completa.
        </div>
      ) : (
        <>
          {/* Partidas visíveis
              na página atual */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {visibleMatches.map(
              (match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  userPlayer={
                    userPlayer
                  }
                  editedPrediction={
                    editedPreds[
                      match.id
                    ]
                  }
                  canEdit={canEdit}
                  saveStatus={
                    predictionSaveStatuses[
                      match.id
                    ] ?? 'idle'
                  }
                  onInputChange={
                    handleInputChange
                  }
                  onSavePrediction={
                    handleSavePrediction
                  }
                  onShareMatchWhatsApp={
                    handleShareMatchWhatsApp
                  }
                  onOpenDetails={
                    (selectedMatch) =>
                      setSelectedMatchId(
                        selectedMatch.id
                      )
                  }
                />
              )
            )}
          </div>

          {/* Informações e controles
              da paginação */}
          <div className="app-soft-panel flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              Mostrando {visibleStart}-
              {visibleEnd} de{' '}
              {filteredMatches.length}{' '}
              partidas
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"

                  onClick={
                    () =>
                      setCurrentPage(
                        Math.max(
                          1,
                          safeCurrentPage - 1
                        )
                      )
                  }

                  disabled={
                    safeCurrentPage === 1
                  }

                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="min-w-[86px] text-center font-mono text-[11px] font-bold text-slate-500">
                  {safeCurrentPage}
                  {' / '}
                  {totalPages}
                </span>

                <button
                  type="button"

                  onClick={
                    () =>
                      setCurrentPage(
                        Math.min(
                          totalPages,
                          safeCurrentPage + 1
                        )
                      )
                  }

                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }

                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"

                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}