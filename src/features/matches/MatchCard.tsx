import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Info,
  Loader2,
  Share2,
} from 'lucide-react';

import {
  getMatchGroupLabel,
} from '../../domain/matchLabels';

import {
  getPredictionLockMessage,
  isPredictionLocked,
} from '../../domain/rules';

import {
  calculatePredictionPoints,
} from '../../domain/scoring';

import type {
  Match,
  Player,
} from '../../types';

import {
  PredictionInputs,
} from './PredictionInputs';

import {
  TeamBadge,
} from './TeamBadge';

import type {
  PredictionSide,
} from './types';

// Representa os valores que o usuário
// está editando localmente.
//
// Esses valores ainda podem não ter sido
// enviados ou confirmados pelo banco.
interface EditedPrediction {
  scoreA: string;
  scoreB: string;
}

// Representa o estado atual
// da operação de salvamento.
//
// idle:
// nenhuma operação acontecendo.
//
// saving:
// o palpite está sendo enviado.
//
// saved:
// o salvamento terminou com sucesso.
//
// error:
// ocorreu uma falha no salvamento.
export type PredictionSaveStatus =
  | 'idle'
  | 'saving'
  | 'saved'
  | 'error';

// Define os dados e as ações
// recebidos do componente pai.
interface MatchCardProps {
  // Partida exibida neste card.
  match: Match;

  // Participante atualmente relacionado
  // ao formulário de palpites.
  userPlayer: Player;

  // Valores digitados localmente
  // e ainda não necessariamente salvos.
  editedPrediction?: EditedPrediction;

  // Indica se o usuário possui permissão
  // para alterar palpites.
  canEdit: boolean;

  // Estado atual do salvamento.
  saveStatus?: PredictionSaveStatus;

  // Executa quando um dos placares
  // é alterado.
  onInputChange: (
    matchId: string,
    side: PredictionSide,
    value: string
  ) => void;

  // Solicita o salvamento do palpite
  // relacionado à partida informada.
  onSavePrediction: (
    matchId: string
  ) => void;

  // Solicita o compartilhamento
  // da partida pelo WhatsApp.
  onShareMatchWhatsApp: (
    match: Match
  ) => void;

  // Abre os detalhes da partida.
  onOpenDetails: (
    match: Match
  ) => void;
}

// Formata a data em que
// o palpite foi salvo ou atualizado.
//
// Quando o valor estiver ausente
// ou representar uma data inválida,
// retorna uma string vazia.
function formatPredictionDate(
  value?: string
): string {
  if (!value) {
    return '';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

// Card responsável por representar
// uma única partida.
//
// Ele mostra:
//
// - times;
// - data e horário;
// - local;
// - palpite salvo;
// - alterações não salvas;
// - resultado oficial;
// - pontuação;
// - estado do salvamento;
// - ações de compartilhamento e detalhes.
export function MatchCard({
  match,
  userPlayer,
  editedPrediction,
  canEdit,
  saveStatus = 'idle',
  onInputChange,
  onSavePrediction,
  onShareMatchWhatsApp,
  onOpenDetails,
}: MatchCardProps) {
  // Procura o palpite salvo do usuário
  // para esta partida.
  //
  // A chave do objeto predictions
  // é o ID da partida.
  const userPrediction =
    userPlayer.predictions[
      match.id
    ];

  // Verifica se o horário da partida
  // já bloqueou novas alterações.
  const isLocked =
    isPredictionLocked(
      match
    );

  // Prepara a explicação
  // sobre o motivo do bloqueio.
  const lockMessage =
    getPredictionLockMessage(
      match
    );

  // Converte os valores salvos
  // para string, pois os inputs
  // trabalham com texto.
  const savedScoreA =
    userPrediction
      ?.scoreA
      ?.toString() ?? '';

  const savedScoreB =
    userPrediction
      ?.scoreB
      ?.toString() ?? '';

  // O valor editado possui prioridade.
//
// Caso não exista edição local,
// utiliza o valor salvo no jogador.
//
// Caso também não exista valor salvo,
// utiliza uma string vazia.
  const currentA =
    editedPrediction?.scoreA ??
    savedScoreA;

  const currentB =
    editedPrediction?.scoreB ??
    savedScoreB;

  // Calcula a pontuação utilizando
  // somente o palpite já salvo.
//
// Alterações locais ainda não salvas
// não modificam a pontuação oficial.
  const predictionResult =
    calculatePredictionPoints(
      userPrediction,
      match
    );

  // Partidas ainda não jogadas
  // não possuem pontos definitivos.
  const pointsEarned =
    predictionResult.type ===
    'unplayed'
      ? null
      : predictionResult.points;

  const pointsType =
    predictionResult.type ===
    'unplayed'
      ? null
      : predictionResult.type;

  // Verifica se o placar A
  // foi alterado em relação
  // ao valor atualmente salvo.
  const hasEditedScoreA =
    editedPrediction?.scoreA !==
      undefined &&
    editedPrediction.scoreA !==
      savedScoreA;

  // Faz a mesma comparação
  // para o placar B.
  const hasEditedScoreB =
    editedPrediction?.scoreB !==
      undefined &&
    editedPrediction.scoreB !==
      savedScoreB;

  // Existe mudança pendente
  // quando pelo menos um dos lados
  // foi alterado.
  const hasUnsavedChanges =
    hasEditedScoreA ||
    hasEditedScoreB;

  // O botão de salvar aparece somente quando:
//
// - o usuário pode editar;
// - a partida ainda não travou;
// - existe alguma alteração não salva.
  const isSaveVisible =
    canEdit &&
    !isLocked &&
    hasUnsavedChanges;

  // Prioriza a data da última atualização.
//
// Caso ela não exista,
// utiliza a data da criação.
  const predictionTimestamp =
    userPrediction?.updatedAt ||
    userPrediction?.createdAt;

  const predictionSavedAt =
    formatPredictionDate(
      predictionTimestamp
    );

  // Confirma que existe um palpite salvo
  // com os dois placares numéricos.
//
// Boolean garante que o resultado
// seja sempre true ou false.
  const hasSavedPrediction =
    Boolean(
      userPrediction &&
      typeof userPrediction.scoreA ===
        'number' &&
      typeof userPrediction.scoreB ===
        'number'
    );

  const isSaving =
    saveStatus === 'saving';

  // Define a aparência externa do card
  // conforme o estado de bloqueio.
  const cardStateClass =
    isLocked
      ? (
          'border-amber-200 ' +
          'bg-amber-50/30'
        )
      : (
          'border-slate-200 ' +
          'hover:border-emerald-500/40'
        );

  return (
    // Card principal da partida.
    <article
      className={
        `relative flex flex-col justify-between ` +
        `overflow-hidden rounded-xl border bg-white ` +
        `p-4 shadow-sm transition md:p-5 ` +
        `${cardStateClass}`
      }
    >
      {/* Fase da competição,
          data e horário */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {getMatchGroupLabel(
            match.group
          )}
        </span>

        <div className="flex items-center gap-1.5 text-right text-[11px] font-semibold text-slate-500">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-600" />

          <span>
            {match.date}
            {' às '}
            {match.time}
          </span>
        </div>
      </div>

      {/* Local da partida.

          O bloco só aparece quando
          existe estádio ou cidade. */}
      {(match.venue || match.city) && (
        <p className="-mt-2 mb-3 text-right text-[10px] font-semibold text-slate-400">
          {
            [
              match.venue,
              match.city,
            ]
              // Remove valores vazios.
              .filter(Boolean)

              // Junta os valores restantes.
              .join(' - ')
          }
        </p>
      )}

      {/* Área principal:
          time A, palpite e time B */}
      <div className="relative my-3 grid grid-cols-7 items-center justify-center">
        {/* Time A */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center">
          <TeamBadge
            flag={match.flagA}
            logo={match.logoA}
            name={match.teamA}
          />

          <span className="mt-2 max-w-[90px] truncate text-sm font-bold leading-tight text-slate-700">
            {match.teamA}
          </span>
        </div>

        {/* Área central com resultado
            e campos de palpite */}
        <div className="col-span-3 flex flex-col items-center justify-center">
          {/* Quando a partida estiver finalizada,
              mostra o resultado oficial.

              Caso contrário, mostra o estado
              do palpite. */}
          {match.status === 'finished'
            ? (
                <div className="mb-2 flex flex-col items-center rounded-lg border border-slate-200/50 bg-slate-100 px-4 py-2">
                  <span className="mb-1 text-[8px] font-bold uppercase tracking-widest text-slate-500">
                    Resultado oficial
                  </span>

                  <span className="text-xl font-black text-slate-800">
                    {match.scoreA}
                    {' : '}
                    {match.scoreB}
                  </span>
                </div>
              )
            : (
                <div className="mb-2 select-none text-xs font-bold uppercase text-slate-400">
                  {isLocked
                    ? 'Palpite travado'
                    : 'Seu palpite'}
                </div>
              )}

          {/* Componente responsável
              pelos dois inputs do placar
              e pelo botão de salvamento. */}
          <PredictionInputs
            scoreA={currentA}
            scoreB={currentB}

            disabled={
              isLocked ||
              !canEdit ||
              isSaving
            }

            canEdit={canEdit}
            isLocked={isLocked}
            lockMessage={lockMessage}
            isSaveVisible={isSaveVisible}

            // Inclui automaticamente
            // o ID desta partida.
            onChange={
              (
                side,
                value
              ) =>
                onInputChange(
                  match.id,
                  side,
                  value
                )
            }

            onSave={
              () =>
                onSavePrediction(
                  match.id
                )
            }
          />

          {/* Área reservada para mensagens
              relacionadas ao salvamento.

              min-h evita que o layout
              fique pulando quando a mensagem muda. */}
          <div className="mt-2 min-h-[34px] text-center">
            {saveStatus === 'saving' && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">
                <Loader2 className="h-3 w-3 animate-spin" />

                Salvando palpite...
              </p>
            )}

            {saveStatus === 'saved' && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />

                Palpite salvo
              </p>
            )}

            {saveStatus === 'error' && (
              <p className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                <AlertTriangle className="h-3 w-3" />

                Erro ao salvar. Tente novamente.
              </p>
            )}

            {/* Estado normal com mudança pendente */}
            {saveStatus === 'idle' &&
              hasUnsavedChanges &&
              !isLocked && (
                <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  <AlertTriangle className="h-3 w-3" />

                  Alteração não salva
                </p>
              )}

            {/* Estado normal com palpite salvo */}
            {saveStatus === 'idle' &&
              !hasUnsavedChanges &&
              hasSavedPrediction &&
              predictionSavedAt && (
                <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />

                  Atualizado em{' '}
                  {predictionSavedAt}
                </p>
              )}

            {/* Usuário ainda não possui
                um palpite salvo. */}
            {saveStatus === 'idle' &&
              !hasUnsavedChanges &&
              !hasSavedPrediction &&
              !isLocked &&
              canEdit && (
                <p className="text-[10px] font-semibold text-slate-400">
                  Você pode salvar ou alterar até o início da partida.
                </p>
              )}
          </div>
        </div>

        {/* Time B */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center">
          <TeamBadge
            flag={match.flagB}
            logo={match.logoB}
            name={match.teamB}
          />

          <span className="mt-2 max-w-[90px] truncate text-sm font-bold leading-tight text-slate-700">
            {match.teamB}
          </span>
        </div>
      </div>

      {/* Rodapé com pontuação,
          compartilhamento e detalhes */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="min-w-0">
          {/* Se existe pontuação definitiva,
              mostra o resultado do palpite.

              Caso contrário,
              mostra o botão de compartilhamento. */}
          {pointsEarned !== null
            ? (
                <div className="flex items-center gap-1.5">
                  {pointsType === 'exact'
                    ? (
                        <span className="rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-800">
                          +3 pts - Exato
                        </span>
                      )
                    : pointsType === 'partial'
                      ? (
                          <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800">
                            +1 pt - Parcial
                          </span>
                        )
                      : (
                          <span className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                            0 pts - Erro
                          </span>
                        )}
                </div>
              )
            : (
                <button
                  type="button"

                  onClick={
                    () =>
                      onShareMatchWhatsApp(
                        match
                      )
                  }

                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 transition hover:text-emerald-700"
                >
                  <Share2 className="h-3.5 w-3.5" />

                  <span>
                    Postar jogo
                  </span>
                </button>
              )}
        </div>

        {/* Abre informações adicionais
            sobre a partida. */}
        <button
          type="button"

          onClick={
            () =>
              onOpenDetails(
                match
              )
          }

          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <span className="inline-flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />

            Detalhes
          </span>
        </button>
      </div>
    </article>
  );
}