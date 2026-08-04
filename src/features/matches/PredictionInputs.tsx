import {
  CheckCircle,
} from 'lucide-react';

import type {
  PredictionSide,
} from './types';

// Dados e ações recebidos
// pelo componente.
interface PredictionInputsProps {
  // Valor atual do placar
  // do primeiro time.
  scoreA: string;

  // Valor atual do placar
  // do segundo time.
  scoreB: string;

  // Bloqueia a interação
  // com os campos.
  //
  // Pode representar:
  //
  // - partida travada;
  // - usuário sem permissão;
  // - salvamento em andamento.
  disabled: boolean;

  // Indica se o usuário possui
  // permissão para editar palpites.
  canEdit: boolean;

  // Indica especificamente
  // se a partida foi travada
  // pela regra de horário.
  isLocked: boolean;

  // Mensagem relacionada
  // à disponibilidade do palpite.
  lockMessage: string;

  // Controla a exibição
  // do botão de salvar.
  isSaveVisible: boolean;

  // Comunica uma alteração
  // ao componente pai.
  onChange: (
    side: PredictionSide,
    value: string
  ) => void;

  // Solicita o salvamento
  // do palpite atual.
  onSave: () => void;
}

// Limpa o valor digitado.
//
// A função:
//
// 1. remove caracteres não numéricos;
// 2. limita o placar a dois dígitos.
function sanitizeScore(
  value: string
): string {
  return value
    .replace(/[^0-9]/g, '')
    .slice(0, 2);
}

// Exibe e controla visualmente
// os dois campos de placar.
//
// O estado verdadeiro dos campos
// permanece no componente pai.
export function PredictionInputs({
  scoreA,
  scoreB,
  disabled,
  canEdit,
  isLocked,
  lockMessage,
  isSaveVisible,
  onChange,
  onSave,
}: PredictionInputsProps) {
  // Classes compartilhadas
  // pelos dois campos.
  const inputClassName =
    `h-14 w-14 rounded-lg border-2 ` +
    `text-center text-2xl font-black ` +
    `transition focus:outline-none ${
      disabled
        ? (
            'cursor-not-allowed ' +
            'border-slate-200 ' +
            'bg-slate-100 ' +
            'text-slate-400'
          )
        : (
            'border-slate-200 ' +
            'bg-slate-50 ' +
            'text-slate-800 ' +
            'focus:border-emerald-500 ' +
            'focus:bg-white ' +
            'focus:ring-1 ' +
            'focus:ring-emerald-500'
          )
    }`;

  // Recebe o lado alterado
  // e o texto bruto do input.
  const handleChange = (
    side: PredictionSide,
    value: string
  ) => {
    // Prepara o valor antes
    // de enviá-lo ao componente pai.
    const cleanValue =
      sanitizeScore(value);

    onChange(
      side,
      cleanValue
    );
  };

  // Define qual mensagem
  // aparece abaixo dos campos.
  //
  // Quando o usuário não pode editar,
  // a interface pressupõe que ele
  // precisa entrar com o Google.
  const helperMessage =
    canEdit
      ? lockMessage
      : 'Entre com o Google para salvar seu palpite.';

  // Partidas travadas recebem
  // uma mensagem em tom de alerta.
  const helperMessageClassName =
    isLocked
      ? 'text-amber-700'
      : 'text-slate-400';

  return (
    <div className="flex flex-col items-center">
      {/* Campos dos dois times */}
      <div className="flex items-center justify-center gap-2">
        <input
          type="text"

          // Solicita teclado numérico
          // em dispositivos móveis.
          inputMode="numeric"

          // Informa ao navegador
          // o padrão esperado.
          pattern="[0-9]*"

          placeholder="0"
          disabled={disabled}
          value={scoreA}

          // Rótulo disponível
          // para tecnologias assistivas.
          aria-label="Placar do primeiro time"

          onChange={
            (event) =>
              handleChange(
                'A',
                event.target.value
              )
          }

          className={inputClassName}
        />

        <span
          className="font-black text-slate-400"
          aria-hidden="true"
        >
          X
        </span>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          disabled={disabled}
          value={scoreB}
          aria-label="Placar do segundo time"

          onChange={
            (event) =>
              handleChange(
                'B',
                event.target.value
              )
          }

          className={inputClassName}
        />
      </div>

      {/* Mensagem sobre bloqueio,
          permissão ou prazo */}
      <p
        className={
          `mt-2 text-center text-[10px] font-semibold ` +
          `${helperMessageClassName}`
        }
      >
        {helperMessage}
      </p>

      {/* O botão aparece somente
          quando o componente pai informa
          que existe algo para salvar. */}
      {isSaveVisible && (
        <button
          type="button"
          onClick={onSave}

          // Impede um novo clique
          // quando os controles estão bloqueados,
          // inclusive durante o salvamento.
          disabled={disabled}

          className={
            `mt-3 flex items-center gap-1 rounded-lg ` +
            `bg-emerald-600 px-2.5 py-1 ` +
            `text-[10px] font-bold text-white transition ` +
            `hover:bg-emerald-700 ` +
            `disabled:cursor-not-allowed ` +
            `disabled:bg-emerald-300`
          }
        >
          <CheckCircle className="h-3 w-3" />

          <span>
            Salvar palpite
          </span>
        </button>
      )}
    </div>
  );
}