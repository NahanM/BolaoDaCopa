import type {
  Player,
} from '../../types';

// Recebe uma data em formato de texto
// e prepara uma versão curta para exibição.
//
// Exemplo de entrada:
//
// "2026-07-27T18:30:00.000Z"
//
// Exemplo aproximado de saída:
//
// "27/07, 15:30"
//
// O horário é convertido para
// o fuso de São Paulo.
function formatAdjustmentDate(
  dateValue?: string
): string {
  // Quando nenhuma data foi informada,
  // não existe texto para formatar.
  if (!dateValue) {
    return '';
  }

  // Converte a string recebida
  // para um objeto Date do JavaScript.
  const date =
    new Date(dateValue);

  // getTime retorna o timestamp da data.
  //
  // Quando a string não representa
  // uma data válida, o resultado será NaN.
  //
  // Number.isNaN verifica exatamente
  // essa situação.
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  // Intl.DateTimeFormat formata a data
  // de acordo com o padrão brasileiro.
  //
  // O fuso America/Sao_Paulo garante
  // que o horário exibido corresponda
  // ao horário usado pelo projeto.
  const formatter =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        timeZone:
          'America/Sao_Paulo',

        day:
          '2-digit',

        month:
          '2-digit',

        hour:
          '2-digit',

        minute:
          '2-digit',
      }
    );

  return formatter.format(date);
}

// Prepara o texto que explica
// o ajuste manual de um participante.
//
// A função recebe somente dois campos
// do tipo Player:
//
// - manualPointsAdjustment;
// - manualPointsAdjustmentUpdatedAt.
//
// Ela não precisa receber todo o jogador.
export function getManualAdjustmentText(
  player: Pick<
    Player,
    | 'manualPointsAdjustment'
    | 'manualPointsAdjustmentUpdatedAt'
  >
): string {
  // Quando o ajuste for:
  //
  // 0
  // undefined
  // null
  //
  // a função não mostra nenhum texto.
  //
  // Isso acontece porque todos esses valores
  // são considerados falsy nessa condição.
  if (
    !player.manualPointsAdjustment
  ) {
    return '';
  }

  // Adiciona o sinal de + apenas
  // quando o ajuste for positivo.
  //
  // Exemplos:
  //
  // 5  -> "+"
  // -3 -> ""
  const sign =
    player.manualPointsAdjustment > 0
      ? '+'
      : '';

  // Tenta formatar a data
  // da última alteração.
  const adjustedAt =
    formatAdjustmentDate(
      player
        .manualPointsAdjustmentUpdatedAt
    );

  // Quando existe uma data válida,
  // adiciona essa informação ao texto.
  //
  // Exemplo:
  //
  // " - alterado em 27/07, 15:30"
  //
  // Caso contrário, não adiciona nada.
  const suffix =
    adjustedAt
      ? ` - alterado em ${adjustedAt}`
      : '';

  // Monta o texto final.
  //
  // Exemplos:
  //
  // Ajuste manual: +5 pts
  //
  // Ajuste manual: -3 pts - alterado em 27/07, 15:30
  return (
    `Ajuste manual: ` +
    `${sign}` +
    `${player.manualPointsAdjustment} pts` +
    `${suffix}`
  );
} 