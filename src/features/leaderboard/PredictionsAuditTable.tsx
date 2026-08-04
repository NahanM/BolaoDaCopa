import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  ListChecks,
} from 'lucide-react';

import {
  calculatePredictionPoints,
} from '../../domain/scoring';

import type {
  Match,
  Player,
} from '../../types';

import {
  buildPredictionAuditRows,
  filterAuditRowsByMatch,
  paginateRows,
} from './auditRows';

import type {
  PredictionAuditRow,
} from './auditRows';

// Define os dados que a tabela
// recebe do componente pai.
interface PredictionsAuditTableProps {
  // Lista de partidas cadastradas.
  matches: Match[];

  // Lista dos participantes
  // e seus respectivos palpites.
  players: Player[];
}

// Quantidade máxima de palpites
// exibidos em cada página.
const AUDIT_PAGE_SIZE = 50;

// Formata uma data salva no palpite
// para uma versão curta e legível.
//
// Exemplo aproximado:
//
// "2026-07-27T18:30:00.000Z"
//
// vira:
//
// "27/07, 15:30"
function formatDateTime(
  value?: string
): string {
  // Quando a data não foi registrada,
  // exibe uma mensagem padrão.
  if (!value) {
    return 'Não informado';
  }

  // Converte a string para um objeto Date.
  const date =
    new Date(value);

  // Datas inválidas geram NaN
  // ao chamar getTime().
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Não informado';
  }

  // Formata a data seguindo
  // o padrão brasileiro.
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

// Monta o texto usado para identificar
// uma partida na tabela.
//
// Exemplo:
//
// 🇧🇷 Brasil x Argentina 🇦🇷
function getMatchLabel(
  match: Match
): string {
  return (
    `${match.flagA} ` +
    `${match.teamA} x ` +
    `${match.teamB} ` +
    `${match.flagB}`
  );
}

// Monta o texto do resultado oficial.
//
// Quando a partida estiver finalizada
// e possuir os dois placares,
// retorna algo como:
//
// "2 x 1"
//
// Caso contrário:
//
// "Em aberto"
function getResultLabel(
  match: Match
): string {
  if (
    match.status === 'finished' &&
    typeof match.scoreA === 'number' &&
    typeof match.scoreB === 'number'
  ) {
    return (
      `${match.scoreA} x ` +
      `${match.scoreB}`
    );
  }

  return 'Em aberto';
}

// Calcula a pontuação do palpite
// e prepara o texto exibido na tela.
//
// Exemplos:
//
// "Aguardando"
// "0 pts"
// "1 pt"
// "3 pts"
function getPointsLabel(
  row: PredictionAuditRow
): string {
  const result =
    calculatePredictionPoints(
      row.prediction,
      row.match
    );

  // Partidas ainda não finalizadas
  // não possuem pontuação definitiva.
  if (result.type === 'unplayed') {
    return 'Aguardando';
  }

  // Usa "pt" no singular
  // somente quando o resultado for 1.
  return (
    `${result.points} ` +
    `${result.points === 1 ? 'pt' : 'pts'}`
  );
}

// Escolhe as classes de aparência
// conforme o resultado do palpite.
function getPointsClass(
  row: PredictionAuditRow
): string {
  const result =
    calculatePredictionPoints(
      row.prediction,
      row.match
    );

  // Acerto exato:
  // destaque amarelo.
  if (result.type === 'exact') {
    return (
      'bg-amber-50 ' +
      'text-amber-700 ' +
      'border-amber-100'
    );
  }

  // Acerto parcial:
  // destaque verde.
  if (result.type === 'partial') {
    return (
      'bg-emerald-50 ' +
      'text-emerald-700 ' +
      'border-emerald-100'
    );
  }

  // Palpite errado:
  // destaque vermelho.
  if (result.type === 'error') {
    return (
      'bg-red-50 ' +
      'text-red-600 ' +
      'border-red-100'
    );
  }

  // Partida ainda não jogada:
  // aparência neutra.
  return (
    'bg-slate-50 ' +
    'text-slate-500 ' +
    'border-slate-100'
  );
}

// Tabela pública de conferência
// dos palpites salvos no banco.
//
// O componente permite:
//
// - visualizar todos os palpites;
// - filtrar por partida;
// - conferir horário do salvamento;
// - conferir resultado e pontuação;
// - navegar entre páginas;
// - visualizar tabela no computador;
// - visualizar cards no celular.
export function PredictionsAuditTable({
  matches,
  players,
}: PredictionsAuditTableProps) {
  // Guarda o filtro de partida atual.
  //
  // "all" significa:
  // mostrar todas as partidas.
  const [
    selectedMatchId,
    setSelectedMatchId,
  ] = useState('all');

  // Guarda a página atual
  // da paginação.
  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  // Constrói as linhas de auditoria
  // juntando partidas, participantes
  // e palpites.
  //
  // useMemo evita reconstruir a lista
  // enquanto matches e players
  // permanecerem iguais.
  const rows =
    useMemo(
      () =>
        buildPredictionAuditRows(
          matches,
          players
        ),

      [
        matches,
        players,
      ]
    );

  // Aplica o filtro da partida selecionada.
  const filteredRows =
    useMemo(
      () =>
        filterAuditRowsByMatch(
          rows,
          selectedMatchId
        ),

      [
        rows,
        selectedMatchId,
      ]
    );

  // Separa os resultados
  // correspondentes à página atual.
  const paginatedRows =
    useMemo(
      () =>
        paginateRows(
          filteredRows,
          currentPage,
          AUDIT_PAGE_SIZE
        ),

      [
        currentPage,
        filteredRows,
      ]
    );

  // Volta para a primeira página quando:
  //
  // - o filtro de partida muda;
  // - a quantidade total de linhas muda.
  //
  // Isso evita permanecer em uma página
  // que não existe mais após uma alteração.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedMatchId,
    rows.length,
  ]);

  // Cria um conjunto contendo
  // somente IDs de partidas
  // que possuem algum palpite.
  //
  // Set não aceita valores duplicados.
  const matchIdsWithPredictions =
    useMemo(
      () =>
        new Set(
          rows.map(
            (row) =>
              row.match.id
          )
        ),

      [rows]
    );

  // Filtra a lista de partidas
  // para mostrar no select somente
  // jogos que realmente possuem palpites.
  const matchesWithPredictions =
    matches.filter(
      (match) =>
        matchIdsWithPredictions.has(
          match.id
        )
    );

  return (
    // Card principal da auditoria.
    //
    // overflow-hidden impede
    // que elementos internos ultrapassem
    // os cantos arredondados do card.
    <section
      id="predictions-audit"
      className="app-card overflow-hidden"
    >
      {/* Cabeçalho da conferência */}
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex min-w-0 items-center gap-2">
          <Eye className="h-5 w-5 shrink-0 text-emerald-600" />

          <div className="min-w-0">
            <h3 className="text-base font-bold uppercase tracking-tight text-slate-800">
              Conferência de palpites
            </h3>

            <p className="text-xs text-slate-500">
              Palpites enviados pelos participantes, com horário e pontuação.
            </p>
          </div>
        </div>

        {/* Quantidade total e filtro */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Quantidade de linhas antes
              da aplicação do filtro */}
          <span className="shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700">
            {rows.length} palpites
          </span>

          {/* Label invisível visualmente,
              mas disponível para leitores de tela. */}
          <label
            htmlFor="prediction-audit-match-filter"
            className="sr-only"
          >
            Filtrar jogo
          </label>

          {/* Select controlado pelo estado
              selectedMatchId. */}
          <select
            id="prediction-audit-match-filter"
            value={selectedMatchId}

            onChange={
              (event) =>
                setSelectedMatchId(
                  event.target.value
                )
            }

            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">
              Todos os jogos
            </option>

            {/* Mostra somente partidas
                que possuem palpites salvos. */}
            {matchesWithPredictions.map(
              (match) => (
                <option
                  key={match.id}
                  value={match.id}
                >
                  {match.teamA} x {match.teamB}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* PRIMEIRA SITUAÇÃO:
          não existe nenhum palpite salvo. */}
      {rows.length === 0
        ? (
            <div className="p-6 text-sm text-slate-600">
              Nenhum palpite foi salvo no banco ainda.
            </div>
          )

        /* SEGUNDA SITUAÇÃO:
           existem palpites, mas nenhum pertence
           à partida escolhida no filtro. */
        : filteredRows.length === 0
          ? (
              <div className="p-6 text-sm text-slate-600">
                Nenhum palpite encontrado para esse jogo.
              </div>
            )

          /* TERCEIRA SITUAÇÃO:
             existem palpites para mostrar. */
          : (
              <>
                {/* Resumo da paginação */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Mostrando{' '}
                    {paginatedRows.startRow}
                    -
                    {paginatedRows.endRow}{' '}
                    de{' '}
                    {paginatedRows.totalRows}{' '}
                    palpites
                  </span>

                  {/* Os controles aparecem somente
                      quando existe mais de uma página. */}
                  {paginatedRows.totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      {/* Página anterior */}
                      <button
                        type="button"

                        onClick={
                          () =>
                            setCurrentPage(
                              (page) =>
                                Math.max(
                                  1,
                                  page - 1
                                )
                            )
                        }

                        // Fica bloqueado
                        // quando já estamos
                        // na primeira página.
                        disabled={
                          paginatedRows.page === 1
                        }

                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* Página atual / total */}
                      <span className="min-w-[86px] text-center font-mono text-[11px] font-bold text-slate-500">
                        {paginatedRows.page}
                        {' / '}
                        {paginatedRows.totalPages}
                      </span>

                      {/* Próxima página */}
                      <button
                        type="button"

                        onClick={
                          () =>
                            setCurrentPage(
                              (page) =>
                                Math.min(
                                  paginatedRows.totalPages,
                                  page + 1
                                )
                            )
                        }

                        // Fica bloqueado
                        // quando já estamos
                        // na última página.
                        disabled={
                          paginatedRows.page ===
                          paginatedRows.totalPages
                        }

                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* VERSÃO PARA COMPUTADOR

                    hidden:
                    fica escondida por padrão.

                    md:block:
                    aparece a partir
                    de telas médias. */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[860px] border-collapse text-left">
                    {/* Cabeçalho da tabela */}
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-4 font-bold">
                          Jogo
                        </th>

                        <th className="px-4 py-4 font-bold">
                          Participante
                        </th>

                        <th className="px-4 py-4 text-center font-bold">
                          Palpite
                        </th>

                        <th className="px-4 py-4 text-center font-bold">
                          Resultado
                        </th>

                        <th className="px-4 py-4 text-center font-bold">
                          Pontos
                        </th>

                        <th className="px-5 py-4 text-right font-bold">
                          Quando
                        </th>
                      </tr>
                    </thead>

                    {/* Linhas da página atual */}
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRows.rows.map(
                        (row) => (
                          <tr
                            key={row.key}
                            className="transition-colors hover:bg-slate-50/60"
                          >
                            {/* Partida */}
                            <td className="px-5 py-4">
                              <div className="text-sm font-semibold text-slate-800">
                                {getMatchLabel(
                                  row.match
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500">
                                {row.match.date}
                                {' às '}
                                {row.match.time}
                              </div>
                            </td>

                            {/* Participante */}
                            <td className="px-4 py-4">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 text-xl">
                                  {row.player.avatar || '⚽'}
                                </span>

                                <span className="truncate text-sm font-semibold text-slate-800">
                                  {row.player.name}
                                </span>
                              </div>
                            </td>

                            {/* Palpite */}
                            <td className="px-4 py-4 text-center">
                              <span className="font-mono text-sm font-black text-slate-800">
                                {row.prediction.scoreA}
                                {' x '}
                                {row.prediction.scoreB}
                              </span>
                            </td>

                            {/* Resultado oficial */}
                            <td className="px-4 py-4 text-center">
                              <span className="font-mono text-xs font-bold text-slate-600">
                                {getResultLabel(
                                  row.match
                                )}
                              </span>
                            </td>

                            {/* Pontuação calculada */}
                            <td className="px-4 py-4 text-center">
                              <span
                                className={
                                  `inline-flex items-center justify-center ` +
                                  `rounded-lg border px-2.5 py-1 ` +
                                  `text-[10px] font-extrabold ` +
                                  `${getPointsClass(row)}`
                                }
                              >
                                {getPointsLabel(row)}
                              </span>
                            </td>

                            {/* Data de criação
                                ou última alteração */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-slate-500">
                                <Clock3 className="h-3.5 w-3.5 text-slate-400" />

                                <span>
                                  {formatDateTime(
                                    row.prediction.updatedAt ||
                                    row.prediction.createdAt
                                  )}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* VERSÃO PARA CELULAR

                    md:hidden:
                    aparece em telas pequenas
                    e desaparece em telas médias
                    ou maiores. */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {paginatedRows.rows.map(
                    (row) => (
                      <article
                        key={row.key}
                        className="bg-white p-4"
                      >
                        {/* Partida e pontos */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-snug text-slate-900">
                              {getMatchLabel(
                                row.match
                              )}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {row.match.date}
                              {' às '}
                              {row.match.time}
                            </p>
                          </div>

                          <span
                            className={
                              `shrink-0 rounded-lg border px-2 py-1 ` +
                              `text-[10px] font-extrabold ` +
                              `${getPointsClass(row)}`
                            }
                          >
                            {getPointsLabel(row)}
                          </span>
                        </div>

                        {/* Informações divididas
                            em quatro pequenos cards */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {/* Participante */}
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Participante
                            </p>

                            <p className="truncate text-xs font-bold text-slate-800">
                              {row.player.avatar || '⚽'}
                              {' '}
                              {row.player.name}
                            </p>
                          </div>

                          {/* Palpite */}
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Palpite
                            </p>

                            <p className="text-xs font-black text-slate-800">
                              {row.prediction.scoreA}
                              {' x '}
                              {row.prediction.scoreB}
                            </p>
                          </div>

                          {/* Resultado oficial */}
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Resultado
                            </p>

                            <p className="text-xs font-bold text-slate-700">
                              {getResultLabel(
                                row.match
                              )}
                            </p>
                          </div>

                          {/* Data do palpite */}
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Quando
                            </p>

                            <p className="text-xs font-bold text-slate-700">
                              {formatDateTime(
                                row.prediction.updatedAt ||
                                row.prediction.createdAt
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </>
            )}

      {/* Rodapé informativo */}
      <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-4 py-3 text-[11px] font-semibold text-slate-500">
        <ListChecks className="h-3.5 w-3.5 shrink-0 text-emerald-600" />

        <span>
          A conferência mostra apenas palpites salvos no banco. Dados de login
          e controles de admin ficam ocultos.
        </span>
      </div>
    </section>
  );
}