import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  Match,
  Player,
  Prediction,
} from '../types';

import {
  AddPlayerForm,
} from '../features/admin/AddPlayerForm';

import {
  AdminChampionPickConfigForm,
} from '../features/admin/AdminChampionPickConfigForm';

import {
  AdminDangerZone,
} from '../features/admin/AdminDangerZone';

import {
  AdminToast,
} from '../features/admin/AdminToast';

import {
  ManualPointsForm,
} from '../features/admin/ManualPointsForm';

import {
  MatchEditorForm,
} from '../features/admin/MatchEditorForm';

import {
  MatchResultForm,
} from '../features/admin/MatchResultForm';

import type {
  AdminToastState,
  ToastType,
} from '../features/admin/types';

import {
  buildDuplicatePlayerPlans,
} from '../domain/playerMerge';

import {
  importLegacyBolaoData,
  previewLegacyBolaoData,
} from '../services/legacyMigrationService';

import {
  syncWorldCupMatchesFromApi,
} from '../services/matchesService';

import {
  consolidatePlayerDuplicates,
} from '../services/playersService';

// Tempo durante o qual
// cada toast permanece visível.
const TOAST_DURATION_MS = 4500;

// Define os modos disponíveis
// na sincronização de partidas.
type ApiSyncMode =
  | 'upcoming'
  | 'today'
  | 'finished'
  | 'all';

// Dados e ações recebidos
// pelo painel administrativo.
interface AdminPanelProps {
  matches: Match[];
  players: Player[];

  // Jogador que deve ter preferência
  // ao escolher o registro principal
  // durante a consolidação.
  preferredPlayerId?: string;

  onUpdateMatchResult: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    status: 'scheduled' | 'finished'
  ) => void | Promise<void>;

  onSaveMatch: (
    match: Match,
    mode: 'create' | 'edit'
  ) => void | Promise<void>;

  onAddPlayer: (
    name: string,
    avatar: string,
    predictions: Record<
      string,
      Prediction
    >
  ) => void | Promise<void>;

  onUpdateManualAdjustment: (
    playerId: string,
    manualPointsAdjustment: number
  ) => void | Promise<void>;

  onSyncDefaultMatches:
    () => void | Promise<void>;
}

// Obtém uma mensagem segura
// para erros de tipo unknown.
function getErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  return error instanceof Error
    ? error.message
    : fallbackMessage;
}

// Painel que reúne as ferramentas
// administrativas do bolão.
//
// Importante:
//
// mostrar este componente apenas
// para administradores não substitui
// as regras de segurança do Firestore.
export function AdminPanel({
  matches,
  players,
  onUpdateMatchResult,
  onSaveMatch,
  preferredPlayerId,
  onAddPlayer,
  onUpdateManualAdjustment,
  onSyncDefaultMatches,
}: AdminPanelProps) {
  // Toast atualmente apresentado.
  const [
    toast,
    setToast,
  ] = useState<
    AdminToastState | null
  >(null);

  // Guarda o temporizador atual
  // para impedir que um toast antigo
  // apague uma mensagem mais recente.
  const toastTimeoutRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

  // Estados das operações
  // relacionadas ao banco antigo.
  const [
    isPreviewingLegacyData,
    setIsPreviewingLegacyData,
  ] = useState(false);

  const [
    isImportingLegacyData,
    setIsImportingLegacyData,
  ] = useState(false);

  const [
    isConsolidatingPlayers,
    setIsConsolidatingPlayers,
  ] = useState(false);

  // Configuração da sincronização
  // dos jogos pela API.
  const [
    apiSyncMode,
    setApiSyncMode,
  ] = useState<ApiSyncMode>(
    'upcoming'
  );

  const [
    apiSyncLimit,
    setApiSyncLimit,
  ] = useState(10);

  const [
    isSyncingApiMatches,
    setIsSyncingApiMatches,
  ] = useState(false);

  // Cancela o temporizador
  // caso o painel seja desmontado.
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(
          toastTimeoutRef.current
        );
      }
    };
  }, []);

  // Exibe uma notificação temporária.
  const triggerToast = (
    message: string,
    type: ToastType = 'success'
  ) => {
    // Cancela o fechamento
    // de qualquer toast anterior.
    if (toastTimeoutRef.current) {
      clearTimeout(
        toastTimeoutRef.current
      );
    }

    setToast({
      message,
      type,
    });

    toastTimeoutRef.current =
      setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, TOAST_DURATION_MS);
  };

  // Apenas verifica os dados
  // disponíveis no banco antigo.
  //
  // Não realiza importação.
  const handlePreviewLegacyData =
    async () => {
      if (isPreviewingLegacyData) {
        return;
      }

      setIsPreviewingLegacyData(
        true
      );

      try {
        const result =
          await previewLegacyBolaoData();

        triggerToast(
          `Banco antigo encontrado: ` +
            `${result.playersCount} jogadores, ` +
            `${result.matchesCount} jogos e ` +
            `${result.predictionsCount} palpites.`,
          'success'
        );

        console.info(
          'Prévia do banco antigo:',
          result
        );
      } catch (error) {
        triggerToast(
          getErrorMessage(
            error,
            'Erro ao verificar banco antigo.'
          ),
          'error'
        );
      } finally {
        setIsPreviewingLegacyData(
          false
        );
      }
    };

  // Importa os dados antigos
  // depois de uma confirmação explícita.
  const handleImportLegacyData =
    async () => {
      if (isImportingLegacyData) {
        return;
      }

      const confirmed =
        window.confirm(
          'Tem certeza que deseja importar o banco antigo para este banco novo? ' +
            'Essa ação vai copiar jogadores e partidas preservando os IDs antigos.'
        );

      if (!confirmed) {
        return;
      }

      setIsImportingLegacyData(
        true
      );

      try {
        const result =
          await importLegacyBolaoData();

        triggerToast(
          `Importação concluída: ` +
            `${result.importedPlayers} jogadores, ` +
            `${result.importedMatches} jogos e ` +
            `${result.predictionsCount} palpites.`,
          'success'
        );

        console.info(
          'Importação do banco antigo:',
          result
        );
      } catch (error) {
        triggerToast(
          getErrorMessage(
            error,
            'Erro ao importar banco antigo.'
          ),
          'error'
        );
      } finally {
        setIsImportingLegacyData(
          false
        );
      }
    };

  // Localiza registros de jogadores
  // que possuem o mesmo e-mail
  // e os consolida em um registro principal.
  const handleConsolidateDuplicatePlayers =
    async () => {
      if (isConsolidatingPlayers) {
        return;
      }

      // Função pura do domínio:
      // apenas analisa os jogadores
      // e prepara o plano de consolidação.
      const duplicatePlans =
        buildDuplicatePlayerPlans(
          players,
          preferredPlayerId
        );

      if (
        duplicatePlans.length === 0
      ) {
        triggerToast(
          'Nenhum jogador duplicado por e-mail encontrado.',
          'info'
        );

        return;
      }

      // Prepara uma prévia textual
      // para a confirmação do administrador.
      const duplicatedEmails =
        duplicatePlans
          .map(
            (plan) =>
              `${plan.email}: ` +
              `manter ${plan.primaryPlayer.name} ` +
              `(${plan.primaryPlayer.id}) e apagar ` +
              `${plan.duplicatePlayers.length} duplicado(s)`
          )
          .join('\n');

      const confirmed =
        window.confirm(
          `Encontramos ${duplicatePlans.length} e-mail(s) duplicado(s).\n\n` +
            `${duplicatedEmails}\n\n` +
            'Deseja consolidar agora?'
        );

      if (!confirmed) {
        return;
      }

      setIsConsolidatingPlayers(
        true
      );

      // Permite informar se parte
      // da operação já foi concluída
      // antes de uma eventual falha.
      let completedPlansCount = 0;

      try {
        // Execução propositalmente sequencial.
        //
        // Isso reduz concorrência de gravações
        // e facilita acompanhar cada grupo.
        for (
          const plan
          of duplicatePlans
        ) {
          await consolidatePlayerDuplicates({
            mergedPlayer:
              plan.mergedPlayer,

            duplicatePlayerIds:
              plan.duplicatePlayers.map(
                (player) =>
                  player.id
              ),
          });

          completedPlansCount += 1;
        }

        // Soma quantos registros duplicados
        // foram removidos em todos os planos.
        const removedPlayersCount =
          duplicatePlans.reduce(
            (
              total,
              plan
            ) =>
              total +
              plan
                .duplicatePlayers
                .length,
            0
          );

        triggerToast(
          `Consolidação concluída: ` +
            `${removedPlayersCount} jogador(es) duplicado(s) removido(s).`,
          'success'
        );
      } catch (error) {
        const baseMessage =
          getErrorMessage(
            error,
            'Erro ao consolidar jogadores duplicados.'
          );

        const partialMessage =
          completedPlansCount > 0
            ? (
                ` ${completedPlansCount} de ` +
                `${duplicatePlans.length} grupo(s) ` +
                `foram concluídos antes da falha.`
              )
            : '';

        triggerToast(
          `${baseMessage}${partialMessage}`,
          'error'
        );
      } finally {
        setIsConsolidatingPlayers(
          false
        );
      }
    };

  // Busca partidas da Copa
  // nas fontes configuradas pelo service.
  const handleSyncWorldCupMatchesFromApi =
    async () => {
      if (isSyncingApiMatches) {
        return;
      }

      setIsSyncingApiMatches(
        true
      );

      try {
        const result =
          await syncWorldCupMatchesFromApi({
            today:
              apiSyncMode === 'today',

            upcoming:
              apiSyncMode === 'upcoming',

            finished:
              apiSyncMode === 'finished',

            // Zero representa
            // ausência de limite.
            limit:
              apiSyncLimit > 0
                ? apiSyncLimit
                : undefined,
          });

        /*
         * PENDÊNCIA DE CONTEXTO:
         *
         * No modo "all", today, upcoming
         * e finished são enviados como false.
         *
         * O service precisa interpretar
         * a ausência de filtros como
         * "buscar todos os jogos".
         */

        triggerToast(
          `Sincronização concluída: ` +
            `${result.imported} jogos processados ` +
            `pela fonte ${result.source}.`,
          'success'
        );
      } catch (error) {
        triggerToast(
          getErrorMessage(
            error,
            'Erro ao sincronizar jogos da Copa pela API.'
          ),
          'error'
        );
      } finally {
        setIsSyncingApiMatches(
          false
        );
      }
    };

  // Indica que alguma operação
  // relacionada ao banco antigo
  // está acontecendo.
  const isLegacyOperationRunning =
    isPreviewingLegacyData ||
    isImportingLegacyData ||
    isConsolidatingPlayers;

  return (
    <div
      id="admin-panel"
      className="relative space-y-6"
    >
      {/* Notificações administrativas */}
      <AdminToast
        toast={toast}
      />

      {/* Cadastro e edição de partidas */}
      <MatchEditorForm
        matches={matches}
        onSaveMatch={onSaveMatch}
        onSuccess={
          (message) =>
            triggerToast(
              message,
              'success'
            )
        }
        onError={
          (message) =>
            triggerToast(
              message,
              'error'
            )
        }
      />

      {/* Sincronização de partidas
          com fontes externas */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Sincronizar jogos pela API
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Busca os jogos da Copa pela ESPN e usa OpenFootball como fallback.
            Os jogos são salvos em matches sem mexer nos palpites dos
            participantes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              O que puxar?
            </span>

            <select
              value={apiSyncMode}
              onChange={
                (event) =>
                  setApiSyncMode(
                    event.target
                      .value as ApiSyncMode
                  )
              }
              disabled={
                isSyncingApiMatches
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="upcoming">
                Próximos jogos
              </option>

              <option value="today">
                Jogos de hoje
              </option>

              <option value="finished">
                Jogos finalizados
              </option>

              <option value="all">
                Todos os status
              </option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">
              Quantidade
            </span>

            <select
              value={apiSyncLimit}
              onChange={
                (event) =>
                  setApiSyncLimit(
                    Number(
                      event.target.value
                    )
                  )
              }
              disabled={
                isSyncingApiMatches
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option value={5}>
                5 jogos
              </option>

              <option value={10}>
                10 jogos
              </option>

              <option value={20}>
                20 jogos
              </option>

              <option value={0}>
                Sem limite
              </option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={
                handleSyncWorldCupMatchesFromApi
              }
              disabled={
                isSyncingApiMatches
              }
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
            >
              {isSyncingApiMatches
                ? 'Sincronizando...'
                : 'Sincronizar jogos'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Para o uso normal do bolão, selecione “Próximos jogos” com 10 ou 20.
          Para carregar a tabela completa, selecione “Todos os status” e “Sem
          limite”.
        </p>
      </div>

      {/* Configuração do palpite
          de campeão da Copa */}
      <AdminChampionPickConfigForm
        onSuccess={
          (message) =>
            triggerToast(
              message,
              'success'
            )
        }
        onError={
          (message) =>
            triggerToast(
              message,
              'error'
            )
        }
      />

      {/* Resultados e ajustes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MatchResultForm
          matches={matches}
          onUpdateMatchResult={
            onUpdateMatchResult
          }
          onSuccess={
            (message) =>
              triggerToast(
                message,
                'success'
              )
          }
          onError={
            (message) =>
              triggerToast(
                message,
                'error'
              )
          }
        />

        <ManualPointsForm
          players={players}
          onUpdateManualAdjustment={
            onUpdateManualAdjustment
          }
          onSuccess={
            (message) =>
              triggerToast(
                message,
                'success'
              )
          }
          onError={
            (message) =>
              triggerToast(
                message,
                'error'
              )
          }
        />
      </div>

      {/* Cadastro manual
          de participantes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AddPlayerForm
          matches={matches}
          onAddPlayer={onAddPlayer}
          onSuccess={
            (message) =>
              triggerToast(
                message,
                'success'
              )
          }
          onError={
            (message) =>
              triggerToast(
                message,
                'error'
              )
          }
        />
      </div>

      {/* Ferramentas de migração */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Migração do banco antigo
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Primeiro verificamos os dados do Firebase antigo. Essa ação não
            grava nada no banco novo e não altera o banco anterior.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              handlePreviewLegacyData
            }
            disabled={
              isLegacyOperationRunning
            }
            className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isPreviewingLegacyData
              ? 'Verificando...'
              : 'Verificar banco antigo'}
          </button>

          <button
            type="button"
            onClick={
              handleImportLegacyData
            }
            disabled={
              isLegacyOperationRunning
            }
            className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-400"
          >
            {isImportingLegacyData
              ? 'Importando...'
              : 'Importar banco antigo'}
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Consolidar jogadores duplicados
            </h4>

            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Use depois de importar o banco antigo. O sistema agrupa jogadores
              com o mesmo e-mail, junta os palpites no jogador principal e
              remove os registros duplicados.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleConsolidateDuplicatePlayers
            }
            disabled={
              isLegacyOperationRunning
            }
            className="rounded-xl bg-amber-600 px-4 py-2 font-bold text-white transition hover:bg-amber-700 disabled:bg-slate-400"
          >
            {isConsolidatingPlayers
              ? 'Consolidando...'
              : 'Consolidar duplicados por e-mail'}
          </button>
        </div>
      </div>

      {/* Ações perigosas e independentes
          da migração do banco antigo */}
      <AdminDangerZone
        onSyncDefaultMatches={
          onSyncDefaultMatches
        }
        onSuccess={
          (message) =>
            triggerToast(
              message,
              'info'
            )
        }
        onError={
          (message) =>
            triggerToast(
              message,
              'error'
            )
        }
      />
    </div>
  );
}