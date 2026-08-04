import type {
  Match,
  Player,
} from '../../types';

// Representa as alterações locais
// dos palpites.
//
// A chave é o ID da partida.
//
// Exemplo:
//
// {
//   "match-1": {
//     scoreA: "2",
//     scoreB: "1"
//   }
// }
type EditedPredictions = Record<
  string,
  {
    scoreA: string;
    scoreB: string;
  }
>;

// Dados compartilhados pelas funções
// que trabalham com várias partidas.
interface ShareTextParams {
  matches: Match[];
  userPlayer: Player;
  editedPreds: EditedPredictions;
}

// Dados necessários para preparar
// o texto de uma única partida.
interface SingleShareTextParams {
  match: Match;
  userPlayer: Player;
  editedPreds: EditedPredictions;
}

// A versão de WhatsApp com várias partidas
// também recebe o endereço público da página.
interface WhatsAppShareTextParams
  extends ShareTextParams {
  pageUrl: string;
}

// Representa o placar que será utilizado
// no texto compartilhado.
interface ResolvedPredictionScore {
  scoreA: string;
  scoreB: string;
}

// Descobre qual placar deve aparecer
// no compartilhamento.
//
// Prioridade atual:
//
// 1. alteração local;
// 2. palpite salvo;
// 3. valor "0".
//
// Importante:
//
// uma string vazia continua vazia,
// porque o operador ?? não considera
// "" como valor ausente.
function getPredictionScore({
  match,
  userPlayer,
  editedPreds,
}: SingleShareTextParams): ResolvedPredictionScore {
  // Palpite já salvo no jogador.
  const savedPrediction =
    userPlayer.predictions[
      match.id
    ];

  // Alteração atual da interface,
// ainda não necessariamente salva.
  const editedPrediction =
    editedPreds[
      match.id
    ];

  const scoreA =
    editedPrediction?.scoreA ??
    savedPrediction
      ?.scoreA
      ?.toString() ??
    '0';

  const scoreB =
    editedPrediction?.scoreB ??
    savedPrediction
      ?.scoreB
      ?.toString() ??
    '0';

  return {
    scoreA,
    scoreB,
  };
}

// Prepara as duas linhas usadas
// para representar uma partida
// no texto do WhatsApp.
function buildWhatsAppMatchBlock(
  params: SingleShareTextParams
): string {
  const {
    match,
  } = params;

  const {
    scoreA,
    scoreB,
  } = getPredictionScore(
    params
  );

  return [
    `${match.flagA} ${match.teamA} *${scoreA}* x *${scoreB}* ${match.teamB} ${match.flagB}`,
    `📅 _${match.date} às ${match.time}_`,
  ].join('\n');
}

// Prepara uma linha numerada
// para o texto copiado.
function buildClipboardMatchLine(
  params: SingleShareTextParams,
  index: number
): string {
  const {
    match,
  } = params;

  const {
    scoreA,
    scoreB,
  } = getPredictionScore(
    params
  );

  return (
    `${index + 1}. ` +
    `${match.flagA} ${match.teamA} ` +
    `${scoreA} x ${scoreB} ` +
    `${match.teamB} ${match.flagB}`
  );
}

// Monta o texto de WhatsApp
// para uma única partida.
export function buildSinglePredictionWhatsAppText({
  match,
  userPlayer,
  editedPreds,
}: SingleShareTextParams): string {
  const {
    scoreA,
    scoreB,
  } = getPredictionScore({
    match,
    userPlayer,
    editedPreds,
  });

  // Cada item do array representa
  // uma linha do texto.
//
// join('\n') une as linhas
// utilizando uma quebra entre elas.
  return [
    '⚽ *MEU PALPITE NO BOLÃO* ⚽',
    '',
    `📅 *Jogo:* ${match.date} às ${match.time}`,
    `${match.flagA} ${match.teamA} *${scoreA}* x *${scoreB}* ${match.teamB} ${match.flagB}`,
    '',
    'Enviado pelo App *Bolão da Copa 2026*',
  ].join('\n');
}

// Monta o texto de WhatsApp
// contendo várias partidas.
export function buildAllPredictionsWhatsAppText({
  matches,
  userPlayer,
  editedPreds,
  pageUrl,
}: WhatsAppShareTextParams): string {
  // map transforma cada partida
  // em um bloco de texto.
  const matchBlocks =
    matches.map(
      (match) =>
        buildWhatsAppMatchBlock({
          match,
          userPlayer,
          editedPreds,
        })
    );

  // join('\n\n') coloca uma linha vazia
  // entre as partidas.
  const matchesText =
    matchBlocks.join(
      '\n\n'
    );

  return [
    '🏆 *MEUS PALPITES - BOLÃO DA COPA 2026* 🏆',
    '',
    '*Entrada:* R$10,00 | *Prêmios:* 80% (1º) e 20% (2º)',
    '------------------------------------',
    '',
    matchesText,
    '',
    `👉 Faça seus palpites e acompanhe o ranking: ${pageUrl}`,
  ].join('\n');
}

// Monta o texto simples
// utilizado na área de transferência.
export function buildAllPredictionsClipboardText({
  matches,
  userPlayer,
  editedPreds,
}: ShareTextParams): string {
  // Cada partida vira
  // uma linha numerada.
  const matchLines =
    matches.map(
      (
        match,
        index
      ) =>
        buildClipboardMatchLine(
          {
            match,
            userPlayer,
            editedPreds,
          },
          index
        )
    );

  return [
    'MEUS PALPITES - BOLÃO DA COPA 2026',
    '',
    'Entrada: R$10,00 | Prêmios: 80% (1º) e 20% (2º)',
    '------------------------------------',
    '',
    matchLines.join('\n'),
  ].join('\n');
}