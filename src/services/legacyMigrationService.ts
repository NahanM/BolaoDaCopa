import {
  getApps,
  initializeApp,
} from 'firebase/app';

import type {
  FirebaseApp,
} from 'firebase/app';

import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from 'firebase/firestore';

import { mergePlayersKeepingPrimary } from '../domain/playerMerge';
import { db } from '../firebase';

import type {
  Player,
} from '../types';

import {
  normalizePlayerDocument,
} from './firestoreNormalizers';

// Nome utilizado para identificar a segunda aplicação Firebase.
//
// A aplicação principal continua ligada ao Firebase atual.
// Esta aplicação separada será ligada ao Firebase antigo.
const OLD_FIREBASE_APP_NAME =
  'old-bolao-production';

// Variáveis de ambiente necessárias
// para conectar ao projeto Firebase antigo.
//
// Na Vercel, elas precisam estar configuradas
// no ambiente em que a migração será executada.
//
// O "as const" faz o TypeScript guardar
// os nomes exatos das chaves do array.
const REQUIRED_OLD_FIREBASE_ENV_KEYS = [
  'VITE_OLD_FIREBASE_API_KEY',
  'VITE_OLD_FIREBASE_AUTH_DOMAIN',
  'VITE_OLD_FIREBASE_PROJECT_ID',
  'VITE_OLD_FIREBASE_STORAGE_BUCKET',
  'VITE_OLD_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_OLD_FIREBASE_APP_ID',
] as const;

// Resultado devolvido pela prévia da migração.
//
// A prévia apenas lê o banco antigo
// e mostra um resumo dos dados encontrados.
// Nenhum documento é gravado no banco atual.
interface LegacyPreviewResult {
  matchesCount: number;
  playersCount: number;
  predictionsCount: number;
  playerNames: string[];
  matchIds: string[];
}

// Possui todos os campos de LegacyPreviewResult
// e acrescenta as quantidades preparadas
// e enviadas para importação.
interface LegacyImportResult
  extends LegacyPreviewResult {
  importedMatches: number;
  importedPlayers: number;
}

// Verifica se um valor desconhecido
// é um objeto comum.
//
// Rejeita null e arrays.
// Isso será usado para validar
// o mapa de palpites dos jogadores.
function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

// Verifica quais variáveis obrigatórias
// do Firebase antigo estão ausentes.
//
// filter percorre a lista de chaves
// e mantém somente aquelas cujo valor
// não existe ou está vazio em import.meta.env.
function getMissingOldFirebaseEnvKeys() {
  const env = import.meta.env;

  return REQUIRED_OLD_FIREBASE_ENV_KEYS.filter(
    (key) => !env[key]
  );
}

// Monta o objeto de configuração
// utilizado para inicializar o Firebase antigo.
//
// Antes de montar a configuração,
// confirma que todas as variáveis obrigatórias existem.
//
// Quando alguma está ausente,
// lança um erro informando os nomes encontrados.
function resolveOldFirebaseConfig() {
  const env = import.meta.env;

  const missingKeys =
    getMissingOldFirebaseEnvKeys();

  if (missingKeys.length > 0) {
    // join transforma o array de chaves
    // em um único texto separado por vírgulas.
    const missingKeysText =
      missingKeys.join(', ');

    throw new Error(
      `Firebase antigo nao configurado. ` +
      `Variaveis ausentes: ${missingKeysText}`
    );
  }

  return {
    apiKey:
      env.VITE_OLD_FIREBASE_API_KEY,

    authDomain:
      env.VITE_OLD_FIREBASE_AUTH_DOMAIN,

    projectId:
      env.VITE_OLD_FIREBASE_PROJECT_ID,

    storageBucket:
      env.VITE_OLD_FIREBASE_STORAGE_BUCKET,

    messagingSenderId:
      env.VITE_OLD_FIREBASE_MESSAGING_SENDER_ID,

    appId:
      env.VITE_OLD_FIREBASE_APP_ID,
  };
}

// Descobre se o Firebase antigo
// utiliza um banco Firestore nomeado.
//
// Quando a variável não existe
// ou contém o texto "(default)",
// retorna undefined para indicar
// que deve ser usado o banco padrão.
function resolveOldDatabaseId():
  string | undefined {
  const env = import.meta.env;

  const databaseId =
    env.VITE_OLD_FIREBASE_DATABASE_ID;

  if (
    !databaseId ||
    databaseId === '(default)'
  ) {
    return undefined;
  }

  return databaseId;
}

// Obtém a aplicação Firebase antiga.
//
// Primeiro procura se uma aplicação
// com o mesmo nome já foi inicializada.
//
// find retorna a primeira aplicação
// que atende à condição ou undefined.
//
// Se já existir, ela é reutilizada.
// Caso contrário, uma nova aplicação
// é criada com a configuração antiga.
function getOldFirebaseApp():
  FirebaseApp {
  const existingApp =
    getApps().find(
      (app) =>
        app.name ===
        OLD_FIREBASE_APP_NAME
    );

  if (existingApp) {
    return existingApp;
  }

  return initializeApp(
    resolveOldFirebaseConfig(),
    OLD_FIREBASE_APP_NAME
  );
}

// Obtém a instância do Firestore antigo.
//
// Quando existe um databaseId específico,
// abre o banco Firestore com esse nome.
//
// Caso contrário, abre o banco padrão
// da aplicação Firebase antiga.
function getOldDb() {
  const oldApp =
    getOldFirebaseApp();

  const oldDatabaseId =
    resolveOldDatabaseId();

  return oldDatabaseId
    ? getFirestore(
        oldApp,
        oldDatabaseId
      )
    : getFirestore(oldApp);
}

// Conta quantos palpites existem
// no mapa predictions de um jogador.
//
// Cada propriedade desse objeto normalmente
// representa o ID de uma partida.
//
// Exemplo:
//
// predictions = {
//   match1: { scoreA: 2, scoreB: 1 },
//   match2: { scoreA: 0, scoreB: 0 }
// }
//
// Object.keys(predictions).length
// retorna 2.
//
// Quando predictions não é um objeto comum,
// retorna zero.
function countPlayerPredictions(
  playerData: Record<string, unknown>
): number {
  const predictions =
    playerData.predictions;

  if (!isRecord(predictions)) {
    return 0;
  }

  return Object.keys(
    predictions
  ).length;
}

// Faz uma prévia dos dados
// existentes no Firebase antigo.
//
// A função lê as coleções matches e players,
// conta partidas, jogadores e palpites
// e devolve alguns nomes e IDs para conferência.
//
// Nenhum dado é gravado no Firebase atual.
export async function previewLegacyBolaoData():
  Promise<LegacyPreviewResult> {
  const oldDb = getOldDb();

  // Promise.all inicia as duas leituras
  // sem esperar uma terminar para começar a outra.
  //
  // O resultado só continua quando
  // as duas consultas forem concluídas.
  const [
    matchesSnapshot,
    playersSnapshot,
  ] = await Promise.all([
    getDocs(
      collection(
        oldDb,
        'matches'
      )
    ),

    getDocs(
      collection(
        oldDb,
        'players'
      )
    ),
  ]);

  let predictionsCount = 0;

  const playerNames: string[] = [];

  playersSnapshot.forEach(
    (document) => {
      const data =
        document.data();

      // += soma a quantidade encontrada
      // ao total acumulado.
      predictionsCount +=
        countPlayerPredictions(data);

      if (
        typeof data.name === 'string'
      ) {
        const cleanName =
          data.name.trim();

        // Somente nomes com conteúdo
        // são adicionados à prévia.
        if (cleanName) {
          playerNames.push(
            cleanName
          );
        }
      }
    }
  );

  // map percorre os documentos
  // e cria uma nova lista contendo
  // somente os IDs das partidas.
  const matchIds =
    matchesSnapshot.docs.map(
      (document) =>
        document.id
    );

  return {
    matchesCount:
      matchesSnapshot.size,

    playersCount:
      playersSnapshot.size,

    predictionsCount,

    // slice limita apenas os dados
    // exibidos no resultado da prévia.
    //
    // Os documentos originais não são alterados.
    playerNames:
      playerNames.slice(0, 10),

    matchIds:
      matchIds.slice(0, 20),
  };
}

// Cria um novo objeto removendo
// propriedades cujo valor seja undefined.
//
// Exemplo:
//
// {
//   id: "match1",
//   city: "Arlington",
//   venue: undefined
// }
//
// vira:
//
// {
//   id: "match1",
//   city: "Arlington"
// }
//
// Essa limpeza acontece apenas
// no primeiro nível do objeto.
function removeUndefinedFields<
  T extends Record<string, unknown>
>(
  value: T
): Record<string, unknown> {
  const entries =
    Object.entries(value);

  const definedEntries =
    entries.filter(
      ([, fieldValue]) =>
        fieldValue !== undefined
    );

  return Object.fromEntries(
    definedEntries
  );
}

// Grava documentos no Firebase atual
// utilizando batches.
//
// A função aceita somente as coleções
// "matches" ou "players".
//
// Os documentos são adicionados
// ao lote atual e enviados a cada 450 gravações.
//
// Depois do commit, um novo lote é criado
// para continuar o processamento.
async function writeCollectionDocsInBatches(
  collectionName:
    'matches' | 'players',

  docs: Array<{
    id: string;
    data: Record<string, unknown>;
  }>
): Promise<void> {
  let batch =
    writeBatch(db);

  let pendingWrites = 0;

  // for...of percorre cada documento
  // que precisa ser importado.
  for (const item of docs) {
    const documentReference =
      doc(
        db,
        collectionName,
        item.id
      );

    // O spread copia todos os campos
    // existentes em item.data.
    //
    // O campo id salvo nos dados possui prioridade.
    // Caso esteja vazio, utiliza o ID do documento.
    const documentData =
      removeUndefinedFields({
        ...item.data,

        id:
          item.data.id ||
          item.id,
      });

    batch.set(
      documentReference,
      documentData,
      {
        // merge: true atualiza os campos enviados
        // sem apagar automaticamente os demais
        // campos de um documento já existente.
        merge: true,
      }
    );

    pendingWrites++;

    // Quando o lote atinge 450 operações,
    // envia as gravações acumuladas.
    if (pendingWrites >= 450) {
      await batch.commit();

      // Depois do commit, o batch anterior
      // não pode mais receber operações.
      //
      // Por isso, criamos um novo lote
      // e zeramos o contador.
      batch =
        writeBatch(db);

      pendingWrites = 0;
    }
  }

  // Caso a quantidade total não seja
  // um múltiplo exato de 450,
  // ainda restará um último lote incompleto.
  //
  // Este bloco envia essas gravações restantes.
  if (pendingWrites > 0) {
    await batch.commit();
  }
}

// Carrega todos os jogadores
// existentes no Firebase atual.
//
// Cada documento passa pelo normalizador.
// Os jogadores válidos são organizados
// em um Map usando o ID como chave.
//
// Estrutura:
//
// playerId → Player
//
// Isso permite localizar um jogador
// diretamente durante a mesclagem.
async function loadCurrentPlayersById():
  Promise<Map<string, Player>> {
  const playersSnapshot =
    await getDocs(
      collection(
        db,
        'players'
      )
    );

  const playersById =
    new Map<string, Player>();

  playersSnapshot.forEach(
    (document) => {
      const player =
        normalizePlayerDocument(
          document.id,
          document.data()
        );

      if (player) {
        playersById.set(
          document.id,
          player
        );
      }
    }
  );

  return playersById;
}

// Tenta mesclar um jogador antigo
// com o jogador de mesmo ID no banco atual.
//
// Primeiro normaliza os dados antigos.
// Depois procura no Map um jogador atual
// utilizando o mesmo ID.
//
// Quando os dois jogadores existem,
// mergePlayersKeepingPrimary é chamado
// mantendo o jogador atual como principal.
//
// O comportamento atual devolve os dados antigos
// sem mesclagem quando algum dos jogadores
// não pode ser encontrado ou normalizado.
//
// Essa regra será revisada junto
// com o arquivo playerMerge.ts.
function mergeLegacyPlayerIntoCurrent(
  playerId: string,

  legacyData:
    Record<string, unknown>,

  currentPlayersById:
    Map<string, Player>
): Record<string, unknown> {
  const legacyPlayer =
    normalizePlayerDocument(
      playerId,
      legacyData
    );

  const currentPlayer =
    currentPlayersById.get(
      playerId
    );

  if (
    !legacyPlayer ||
    !currentPlayer
  ) {
    return legacyData;
  }

  const mergedPlayer =
    mergePlayersKeepingPrimary(
      currentPlayer,
      legacyPlayer
    );

  return {
    ...mergedPlayer,
  };
}

// Executa a migração do Firebase antigo
// para o Firebase atual.
//
// A função:
//
// 1. lê partidas antigas;
// 2. lê jogadores antigos;
// 3. carrega os jogadores atuais;
// 4. prepara os documentos;
// 5. mescla jogadores com o mesmo ID;
// 6. grava partidas e jogadores em batches;
// 7. devolve um resumo da importação.
export async function importLegacyBolaoData():
  Promise<LegacyImportResult> {
  const oldDb = getOldDb();

  // As três leituras começam em paralelo:
  //
  // - partidas antigas;
// - jogadores antigos;
// - jogadores atuais.
  //
  // O código continua somente
  // quando todas forem concluídas.
  const [
    matchesSnapshot,
    playersSnapshot,
    currentPlayersById,
  ] = await Promise.all([
    getDocs(
      collection(
        oldDb,
        'matches'
      )
    ),

    getDocs(
      collection(
        oldDb,
        'players'
      )
    ),

    loadCurrentPlayersById(),
  ]);

  let predictionsCount = 0;

  const playerNames: string[] = [];

  // Prepara os documentos antigos de partidas
  // no formato esperado pela função de batches:
  //
  // {
  //   id: string,
  //   data: objeto
  // }
  //
  // As partidas ainda são copiadas
  // com os dados brutos do Firebase antigo.
  const legacyMatches =
    matchesSnapshot.docs.map(
      (document) => ({
        id: document.id,
        data: document.data(),
      })
    );

  // Prepara os jogadores antigos.
  //
  // Para cada jogador:
  // - conta seus palpites;
  // - adiciona o nome ao resumo;
  // - tenta mesclar com o jogador atual;
  // - monta o formato esperado pelo batch.
  const legacyPlayers =
    playersSnapshot.docs.map(
      (document) => {
        const data =
          document.data();

        predictionsCount +=
          countPlayerPredictions(data);

        if (
          typeof data.name ===
          'string'
        ) {
          const cleanName =
            data.name.trim();

          if (cleanName) {
            playerNames.push(
              cleanName
            );
          }
        }

        const mergedData =
          mergeLegacyPlayerIntoCurrent(
            document.id,
            data,
            currentPlayersById
          );

        return {
          id: document.id,
          data: mergedData,
        };
      }
    );

  // Importa primeiro as partidas.
  //
  // Depois importa os jogadores
  // e seus respectivos palpites.
  //
  // Cada chamada pode executar vários commits,
  // dependendo da quantidade de documentos.
  await writeCollectionDocsInBatches(
    'matches',
    legacyMatches
  );

  await writeCollectionDocsInBatches(
    'players',
    legacyPlayers
  );

  // Os batches são independentes.
  //
  // Portanto, se a importação de partidas concluir
  // e a de jogadores falhar, a migração pode ficar
  // parcialmente concluída.
  //
  // O uso de merge: true permite que a operação
  // seja executada novamente sem substituir
  // completamente os documentos atuais.
  return {
    matchesCount:
      matchesSnapshot.size,

    playersCount:
      playersSnapshot.size,

    predictionsCount,

    playerNames:
      playerNames.slice(0, 10),

    matchIds:
      matchesSnapshot.docs
        .map(
          (document) =>
            document.id
        )
        .slice(0, 20),

    importedMatches:
      legacyMatches.length,

    importedPlayers:
      legacyPlayers.length,
  };
}