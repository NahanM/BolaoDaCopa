import assert from 'node:assert/strict';

import { renderToStaticMarkup } from 'react-dom/server';

import { AppHeader } from '../src/components/layout/AppHeader';
import { AppNavigation } from '../src/components/layout/AppNavigation';
import { MatchesList } from '../src/components/MatchesList';
import {
  BOLAO_ENCERRADO,
  parseBolaoEncerrado,
} from '../src/config/bolaoStatus';
import { HomePage } from '../src/features/home/HomePage';
import { MatchCard } from '../src/features/matches/MatchCard';
import { buildAllPredictionsClipboardText } from '../src/features/matches/shareText';
import {
  getFilteredMatches,
  getMatchFilterCounts,
} from '../src/domain/matchFilters';
import { calculatePrizes, getPaidParticipants } from '../src/domain/finance';
import { isPredictionLocked } from '../src/domain/rules';
import {
  calculatePredictionPoints,
  computeLeaderboard,
} from '../src/domain/scoring';
import { Match, Player, Prediction } from '../src/types';

function createMatch(overrides: Partial<Match> = {}): Match {
  const startsAt = overrides.startsAt || '2099-06-01T15:00:00.000Z';

  return {
    id: 'match-1',
    teamA: 'Brasil',
    teamB: 'Argentina',
    flagA: 'BR',
    flagB: 'AR',
    date: '01/06/2099',
    time: '12:00',
    startsAt,
    startsAtMs: new Date(startsAt).getTime(),
    status: 'scheduled',
    group: 'Grupo A',
    ...overrides,
  };
}

function createPrediction(
  scoreA: number,
  scoreB: number,
  updatedAt = '2026-06-01T12:00:00.000Z'
): Prediction {
  return {
    scoreA,
    scoreB,
    createdAt: updatedAt,
    updatedAt,
  };
}

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'Jogador Teste',
    avatar: '⚽',
    predictions: {},
    points: 0,
    exactHits: 0,
    partialHits: 0,
    errorHits: 0,
    manualPointsAdjustment: 0,
    manualPointsAdjustmentUpdatedAt: '',
    lastPredictionMatchId: '',
    isAdmin: false,
    email: 'jogador@example.com',
    ...overrides,
  };
}

const finishedMatch = createMatch({
  id: 'finished',
  status: 'finished',
  scoreA: 2,
  scoreB: 1,
});

assert.deepEqual(
  calculatePredictionPoints(createPrediction(2, 1), finishedMatch),
  { points: 3, type: 'exact' }
);
assert.deepEqual(
  calculatePredictionPoints(createPrediction(3, 0), finishedMatch),
  { points: 1, type: 'partial' }
);
assert.deepEqual(
  calculatePredictionPoints(createPrediction(0, 1), finishedMatch),
  { points: 0, type: 'error' }
);
assert.deepEqual(
  calculatePredictionPoints(undefined, finishedMatch),
  { points: 0, type: 'unplayed' }
);

const rankingMatches = [
  createMatch({ id: 'm1', status: 'finished', scoreA: 2, scoreB: 1 }),
  createMatch({ id: 'm2', status: 'finished', scoreA: 0, scoreB: 0 }),
  createMatch({ id: 'm3', status: 'finished', scoreA: 1, scoreB: 3 }),
];

const ranking = computeLeaderboard(
  [
    createPlayer({
      id: 'alice',
      name: 'Alice',
      manualPointsAdjustment: 2,
      predictions: {
        m1: createPrediction(2, 1),
        m2: createPrediction(1, 1),
      },
    }),
    createPlayer({
      id: 'bob',
      name: 'Bob',
      predictions: {
        m1: createPrediction(2, 1),
        m2: createPrediction(0, 0),
        m3: createPrediction(4, 4),
      },
    }),
  ],
  rankingMatches
);

assert.equal(ranking[0].id, 'bob');
assert.equal(ranking[0].points, 6);
assert.equal(ranking[0].exactHits, 2);
assert.equal(ranking[1].id, 'alice');
assert.equal(ranking[1].points, 6);
assert.equal(ranking[1].errorHits, 0);

const paidPlayers = getPaidParticipants([
  createPlayer({ id: 'paid-1', isAdmin: false }),
  createPlayer({ id: 'admin-1', isAdmin: true }),
  createPlayer({ id: 'paid-2', isAdmin: false }),
]);

assert.equal(paidPlayers.length, 2);
assert.deepEqual(calculatePrizes(paidPlayers.length), {
  totalPrizePool: 20,
  firstPrize: 16,
  secondPrize: 4,
});

const openWithoutPrediction = createMatch({ id: 'open-without-prediction' });
const openWithPrediction = createMatch({ id: 'open-with-prediction' });
const lockedWithoutPrediction = createMatch({
  id: 'locked-without-prediction',
  startsAt: '2000-06-01T15:00:00.000Z',
});
const lockedWithPrediction = createMatch({
  id: 'locked-with-prediction',
  startsAt: '2000-06-02T15:00:00.000Z',
});
const finishedWithResult = createMatch({
  id: 'finished-with-result',
  status: 'finished',
  scoreA: 1,
  scoreB: 1,
});
const filterMatches = [
  openWithoutPrediction,
  openWithPrediction,
  lockedWithoutPrediction,
  lockedWithPrediction,
  finishedWithResult,
];
const filterPlayer = createPlayer({
  predictions: {
    [openWithPrediction.id]: createPrediction(1, 0),
    [lockedWithPrediction.id]: createPrediction(0, 0),
  },
});

assert.deepEqual(getMatchFilterCounts(filterMatches, filterPlayer), {
  open: 2,
  missing: 1,
  predicted: 2,
  locked: 2,
  finished: 1,
  all: 5,
});
assert.deepEqual(
  getFilteredMatches(filterMatches, filterPlayer, 'missing').map(
    (match) => match.id
  ),
  ['open-without-prediction']
);
assert.deepEqual(
  getFilteredMatches(filterMatches, filterPlayer, 'locked').map(
    (match) => match.id
  ),
  ['locked-without-prediction', 'locked-with-prediction']
);
assert.equal(getFilteredMatches(filterMatches, filterPlayer, 'all').length, 5);

assert.equal(isPredictionLocked(openWithoutPrediction), false);
assert.equal(isPredictionLocked(lockedWithoutPrediction), true);
assert.equal(isPredictionLocked(finishedWithResult), true);

const cardMatch = createMatch({ id: 'card-match' });
const cardPlayer = createPlayer({
  predictions: {
    [cardMatch.id]: createPrediction(1, 0, '2026-06-01T12:30:00.000Z'),
  },
});
const noop = () => undefined;
const renderCard = (
  saveStatus: 'idle' | 'saving' | 'saved' | 'error',
  editedPrediction?: { scoreA: string; scoreB: string }
) =>
  renderToStaticMarkup(
    <MatchCard
      match={cardMatch}
      userPlayer={cardPlayer}
      editedPrediction={editedPrediction}
      canEdit
      saveStatus={saveStatus}
      onInputChange={noop}
      onSavePrediction={noop}
      onShareMatchWhatsApp={noop}
      onOpenDetails={noop}
    />
  );

assert.ok(
  renderCard('idle', { scoreA: '2', scoreB: '0' }).includes(
    'Alteração não salva'
  )
);
assert.ok(
  renderCard('saving', { scoreA: '2', scoreB: '0' }).includes(
    'Salvando palpite'
  )
);
assert.ok(
  renderCard('saved', { scoreA: '2', scoreB: '0' }).includes('Palpite salvo')
);
assert.ok(renderCard('idle').includes('Atualizado em'));

// Texto de "Copiar todos".
//
// O teste de navegador roda sem partidas, então
// esse texto é conferido aqui.
assert.ok(
  buildAllPredictionsClipboardText({
    matches: [cardMatch],
    userPlayer: cardPlayer,
    editedPreds: {},
  }).includes('1. BR Brasil 1 x 0 Argentina AR')
);

// Modo encerrado: leitura da flag.
//
// Só "true" encerra o bolão. Um valor inesperado na Vercel
// não pode esconder o login de um bolão que está aberto.
assert.equal(parseBolaoEncerrado('true'), true);
assert.equal(parseBolaoEncerrado(' TRUE '), true);
assert.equal(parseBolaoEncerrado('false'), false);
assert.equal(parseBolaoEncerrado(''), false);
assert.equal(parseBolaoEncerrado('1'), false);
assert.equal(parseBolaoEncerrado(undefined), false);

// Fora do Vite, import.meta.env não existe e o bolão fica aberto.
assert.equal(BOLAO_ENCERRADO, false);

// Modo encerrado: cabeçalho.
const renderHeader = (showLogin?: boolean) =>
  renderToStaticMarkup(
    <AppHeader
      currentUser={null}
      points={0}
      totalPrizePool={0}
      canEditProfile={false}
      showLogin={showLogin}
      onLogin={noop}
      onLogout={noop}
      onUpdateProfile={async () => undefined}
    />
  );

assert.ok(renderHeader().includes('Entrar com Google'));
assert.ok(renderHeader().includes('Bolão da Copa'));
assert.ok(!renderHeader().includes('Sponte'));
assert.ok(!renderHeader(false).includes('Entrar com Google'));

// Modo encerrado: navegação.
const renderNavigation = (isClosed?: boolean) =>
  renderToStaticMarkup(
    <AppNavigation
      activeTab="home"
      isAdmin={false}
      isClosed={isClosed}
      onChangeTab={noop}
    />
  );

assert.ok(renderNavigation().includes('Meus Palpites'));
assert.ok(renderNavigation().includes('Bolão da Copa'));
assert.ok(!renderNavigation().includes('Bolao Bet'));
assert.ok(!renderNavigation(true).includes('Meus Palpites'));
assert.ok(renderNavigation(true).includes('Partidas'));

// Modo encerrado: página inicial, inclusive com a
// Bolsa Campeão ainda aberta na configuração salva.
const renderHome = (isClosed?: boolean) =>
  renderToStaticMarkup(
    <HomePage
      totalPrizePool={20}
      firstPrize={16}
      secondPrize={4}
      participantsCount={2}
      championPickSettings={{
        enabled: true,
        locked: false,
        bonusPoints: 30,
        championTeamCode: '',
        eligibleTeamCodes: ['BRA'],
        eligibleTeams: [{ code: 'BRA', name: 'Brasil' }],
      }}
      currentChampionPick={null}
      isUserLoggedIn={false}
      isSavingChampionPick={false}
      isClosed={isClosed}
      onPickChampionTeam={noop}
      onGoToMatches={noop}
      onGoToRanking={noop}
    />
  );

assert.ok(renderHome().includes('Fazer meus palpites'));
assert.ok(renderHome().includes('Entre com sua conta Google'));

const closedHome = renderHome(true);

assert.ok(closedHome.includes('Ver classificação'));
assert.ok(closedHome.includes('A Bolsa Campeão foi encerrada.'));
assert.ok(!closedHome.includes('Fazer meus palpites'));
assert.ok(!closedHome.includes('Entre com'));
assert.ok(!closedHome.includes('Faça seus palpites'));
assert.ok(!closedHome.includes('Aberta'));

// Modo encerrado: lista de partidas de um visitante.
//
// Com todas as partidas finalizadas, o filtro padrão
// "Abertos" deixaria a lista vazia.
const renderMatchesList = (isClosed?: boolean) =>
  renderToStaticMarkup(
    <MatchesList
      matches={[finishedMatch]}
      players={[]}
      userPlayer={createPlayer({ predictions: {} })}
      canEdit={false}
      isClosed={isClosed}
      onUpdatePrediction={noop}
    />
  );

const openMatchesList = renderMatchesList();

assert.ok(openMatchesList.includes('Abertos ('));
assert.ok(openMatchesList.includes('Copiar todos'));
assert.ok(openMatchesList.includes('Nenhuma partida encontrada'));

const closedMatchesList = renderMatchesList(true);

assert.ok(closedMatchesList.includes('Resultado oficial'));
assert.ok(closedMatchesList.includes('Detalhes'));
assert.ok(closedMatchesList.includes('Todos ('));
assert.ok(closedMatchesList.includes('Finalizados ('));
assert.ok(!closedMatchesList.includes('<input'));
assert.ok(!closedMatchesList.includes('Entre com'));
assert.ok(!closedMatchesList.includes('Copiar todos'));
assert.ok(!closedMatchesList.includes('Postar jogo'));
assert.ok(!closedMatchesList.includes('Abertos ('));
assert.ok(!closedMatchesList.includes('Sem palpite ('));
assert.ok(!closedMatchesList.includes('Meus palpites ('));

console.log(
  JSON.stringify(
    {
      scoring: 'passed',
      ranking: ranking.map((player) => ({
        id: player.id,
        points: player.points,
        exactHits: player.exactHits,
        partialHits: player.partialHits,
        errorHits: player.errorHits,
      })),
      filters: getMatchFilterCounts(filterMatches, filterPlayer),
      predictionLock: 'passed',
      predictionCardStatuses: 'passed',
      closedMode: 'passed',
      prizes: calculatePrizes(paidPlayers.length),
    },
    null,
    2
  )
);
