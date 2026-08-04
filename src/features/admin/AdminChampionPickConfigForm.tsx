import {
  useEffect,
  useState,
} from 'react';

import {
  LockKeyhole,
  Plus,
  Save,
  Trash2,
  Trophy,
} from 'lucide-react';

import {
  DEFAULT_CHAMPION_PICK_SETTINGS,
  getChampionPickSettings,
  saveChampionPickSettings,
} from '../../services/championPickService';

import type {
  ChampionPickSettings,
  ChampionPickTeam,
} from '../../types';

// Define as funções que este componente
// recebe do componente pai.
interface AdminChampionPickConfigFormProps {
  // Exibe uma mensagem quando
  // a configuração é salva corretamente.
  onSuccess: (
    message: string
  ) => void;

  // Exibe uma mensagem quando
  // ocorre algum erro.
  onError: (
    message: string
  ) => void;
}

// Estado inicial do pequeno formulário
// usado para cadastrar uma nova seleção.
//
// Ele começa com todos os campos vazios.
const EMPTY_TEAM_DRAFT:
  ChampionPickTeam = {
    code: '',
    name: '',
    logo: '',
  };

// Limpa e padroniza os dados
// digitados para uma seleção.
//
// code:
// remove espaços e transforma em maiúsculas.
//
// name:
// remove espaços no começo e no fim.
//
// logo:
// remove espaços e transforma texto vazio em null.
function normalizeTeamDraft(
  team: ChampionPickTeam
): ChampionPickTeam {
  return {
    code:
      team.code
        .trim()
        .toUpperCase(),

    name:
      team.name.trim(),

    logo:
      team.logo?.trim() ||
      null,
  };
}

// Verifica se já existe uma seleção
// com o mesmo código.
//
// some percorre a lista e retorna true
// assim que encontra um item
// que atende à condição.
//
// Os códigos são comparados
// sem considerar espaços ou letras minúsculas.
function teamAlreadyExists(
  eligibleTeams:
    ChampionPickTeam[],

  teamCode: string
): boolean {
  return eligibleTeams.some(
    (team) =>
      team.code
        .trim()
        .toUpperCase() ===
      teamCode
        .trim()
        .toUpperCase()
  );
}

// Formulário administrativo responsável
// pela configuração da Bolsa Campeão.
//
// Permite:
// - definir o total de pontos do bônus;
// - liberar as escolhas;
// - travar as escolhas;
// - cadastrar seleções disponíveis;
// - remover seleções;
// - salvar a configuração no Firestore.
export function AdminChampionPickConfigForm({
  onSuccess,
  onError,
}: AdminChampionPickConfigFormProps) {
  // Guarda a configuração completa
  // da Bolsa Campeão.
  //
  // Enquanto os dados reais ainda não chegaram,
  // utiliza a configuração padrão.
  const [
    settings,
    setSettings,
  ] = useState<ChampionPickSettings>(
    DEFAULT_CHAMPION_PICK_SETTINGS
  );

  // Guarda os dados temporários
  // da nova seleção que está sendo digitada.
  //
  // Esse estado ainda não faz parte
  // da lista oficial de seleções.
  const [
    teamDraft,
    setTeamDraft,
  ] = useState<ChampionPickTeam>(
    EMPTY_TEAM_DRAFT
  );

  // Indica se a configuração inicial
  // ainda está sendo carregada.
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  // Indica se a configuração
  // está sendo salva.
  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  // useEffect executa depois
  // que o componente aparece na tela.
  //
  // Neste caso, ele busca a configuração
  // atual da Bolsa Campeão.
  useEffect(() => {
    // Controla se o componente
    // continua montado na tela.
    //
    // Isso evita tentar alterar o estado
    // depois que o componente já foi removido.
    let isMounted = true;

    // Função interna assíncrona
    // responsável por carregar a configuração.
    async function loadSettings() {
      try {
        const loadedSettings =
          await getChampionPickSettings();

        // Só atualiza o estado
        // se o componente ainda estiver na tela.
        if (isMounted) {
          setSettings(
            loadedSettings
          );
        }
      } catch (error) {
        // Se o valor capturado realmente
        // for um objeto Error,
        // utiliza sua mensagem original.
        //
        // Caso contrário,
        // utiliza uma mensagem padrão.
        onError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar configuração da Bolsa Campeão.'
        );
      } finally {
        // O finally executa tanto em sucesso
        // quanto em erro.
        //
        // Quando o componente ainda está montado,
        // encerra o estado de carregamento.
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Executa a função criada acima.
    loadSettings();

    // Esta função de limpeza executa
    // quando o componente é removido da tela
    // ou antes de o efeito executar novamente.
    return () => {
      isMounted = false;
    };
  }, [onError]);

  // Adiciona a seleção digitada
  // à lista local de seleções disponíveis.
  //
  // Essa função ainda não salva no Firestore.
  // O salvamento só acontece em handleSave.
  const handleAddTeam = () => {
    // Limpa e padroniza
    // os valores digitados.
    const normalizedTeam =
      normalizeTeamDraft(
        teamDraft
      );

    // Código e nome são obrigatórios.
    if (
      !normalizedTeam.code ||
      !normalizedTeam.name
    ) {
      onError(
        'Informe pelo menos o código e o nome da seleção.'
      );

      return;
    }

    // Limita o tamanho do código.
    if (
      normalizedTeam.code.length >
      20
    ) {
      onError(
        'O código da seleção deve ter no máximo 20 caracteres.'
      );

      return;
    }

    // Limita o tamanho do nome.
    if (
      normalizedTeam.name.length >
      100
    ) {
      onError(
        'O nome da seleção deve ter no máximo 100 caracteres.'
      );

      return;
    }

    // O logo é opcional.
    //
    // Quando existir, sua URL
    // pode ter no máximo 500 caracteres.
    if (
      normalizedTeam.logo &&
      normalizedTeam.logo.length >
        500
    ) {
      onError(
        'A URL do logo deve ter no máximo 500 caracteres.'
      );

      return;
    }

    // Impede cadastrar duas seleções
    // com o mesmo código.
    if (
      teamAlreadyExists(
        settings.eligibleTeams,
        normalizedTeam.code
      )
    ) {
      onError(
        'Essa seleção já está na lista.'
      );

      return;
    }

    // Atualiza a configuração local.
    //
    // O spread mantém os outros campos
    // de settings.
    //
    // O segundo spread copia as seleções
    // já existentes e adiciona a nova
    // no final da lista.
    setSettings(
      (currentSettings) => ({
        ...currentSettings,

        eligibleTeams: [
          ...currentSettings
            .eligibleTeams,

          normalizedTeam,
        ],
      })
    );

    // Limpa os campos usados
    // para cadastrar a próxima seleção.
    setTeamDraft(
      EMPTY_TEAM_DRAFT
    );
  };

  // Remove uma seleção da lista local.
  //
  // A remoção ainda não é enviada ao banco.
  // É necessário clicar em salvar depois.
  const handleRemoveTeam = (
    teamCode: string
  ) => {
    setSettings(
      (currentSettings) => ({
        ...currentSettings,

        // filter cria uma nova lista
        // mantendo somente as seleções
        // cujo código seja diferente
        // do código que deve ser removido.
        eligibleTeams:
          currentSettings
            .eligibleTeams
            .filter(
              (team) =>
                team.code !==
                teamCode
            ),
      })
    );
  };

  // Salva a configuração completa
  // por meio do championPickService.
  const handleSave = async () => {
    // Bloqueia os campos e o botão
    // enquanto o salvamento acontece.
    setIsSaving(true);

    try {
      await saveChampionPickSettings({
        // Mantém todos os campos
        // da configuração atual.
        ...settings,

        // Normaliza novamente todas
        // as seleções antes de salvar.
        //
        // Isso garante códigos em maiúsculas
        // e textos sem espaços externos.
        eligibleTeams:
          settings
            .eligibleTeams
            .map(
              normalizeTeamDraft
            ),

        // Também normaliza o código
        // da seleção campeã.
        championTeamCode:
          settings
            .championTeamCode
            .trim()
            .toUpperCase(),
      });

      onSuccess(
        'Configuração da Bolsa Campeão salva com sucesso.'
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar configuração da Bolsa Campeão.'
      );
    } finally {
      // Libera novamente os campos,
      // independentemente de sucesso ou erro.
      setIsSaving(false);
    }
  };

  return (
    // Card principal da configuração.
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      {/* Cabeçalho da seção */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Pequena identificação visual
              da funcionalidade */}
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-800">
            <Trophy className="h-3.5 w-3.5" />

            Bolsa Campeão
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-900">
            Configuração da Bolsa Campeão
          </h3>

          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Cadastre manualmente as seleções que poderão ser escolhidas quando o mata-mata chegar.
          </p>
        </div>

        {/* Ícone decorativo de bloqueio */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <LockKeyhole className="h-5 w-5" />
        </div>
      </div>

      {/* Configurações principais:
          pontos, liberação e bloqueio */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Campo do valor total do bônus */}
        <label className="space-y-1">
          <span className="text-sm font-semibold text-slate-700">
            Bônus total
          </span>

          <input
            type="number"
            min={0}

            // Input controlado pelo estado.
            value={
              settings.bonusPoints
            }

            onChange={
              (event) =>
                setSettings(
                  (
                    currentSettings
                  ) => ({
                    ...currentSettings,

                    // O valor do input chega
                    // como string.
                    //
                    // Number transforma essa string
                    // em número.
                    bonusPoints:
                      Number(
                        event
                          .target
                          .value
                      ),
                  })
                )
            }

            disabled={
              isLoading ||
              isSaving
            }

            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          />

          <p className="text-xs text-slate-500">
            Esse valor será dividido entre quem escolher o campeão.
          </p>
        </label>

        {/* Controle que libera
            as escolhas dos participantes */}
        <label className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"

              // Checkbox controlado.
              //
              // checked espera um booleano.
              checked={
                settings.enabled
              }

              onChange={
                (event) =>
                  setSettings(
                    (
                      currentSettings
                    ) => ({
                      ...currentSettings,

                      // Para checkbox,
                      // utilizamos checked
                      // em vez de value.
                      enabled:
                        event
                          .target
                          .checked,
                    })
                  )
              }

              disabled={
                isLoading ||
                isSaving
              }

              className="h-4 w-4"
            />

            <div>
              <span className="text-sm font-bold text-slate-900">
                Liberar escolhas
              </span>

              <p className="mt-1 text-xs text-slate-500">
                Deixe desligado até o mata-mata.
              </p>
            </div>
          </div>
        </label>

        {/* Controle que encerra
            as alterações das escolhas */}
        <label className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={
                settings.locked
              }

              onChange={
                (event) =>
                  setSettings(
                    (
                      currentSettings
                    ) => ({
                      ...currentSettings,

                      locked:
                        event
                          .target
                          .checked,
                    })
                  )
              }

              disabled={
                isLoading ||
                isSaving
              }

              className="h-4 w-4"
            />

            <div>
              <span className="text-sm font-bold text-slate-900">
                Travar escolhas
              </span>

              <p className="mt-1 text-xs text-slate-500">
                Use quando o prazo acabar.
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Área usada para cadastrar
          e visualizar seleções disponíveis */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-slate-900">
              Seleções disponíveis
            </h4>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Adicione somente as seleções que poderão ser escolhidas pelos participantes.
            </p>
          </div>

          {/* Mostra a quantidade atual
              de seleções cadastradas */}
          <strong className="rounded-lg bg-white px-3 py-1 text-sm font-black text-slate-900 shadow-sm">
            {
              settings
                .eligibleTeams
                .length
            }
          </strong>
        </div>

        {/* Formulário pequeno para cadastrar
            uma seleção na lista local */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr_1.5fr_auto]">
          {/* Código da seleção */}
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-600">
              Código
            </span>

            <input
              type="text"
              value={
                teamDraft.code
              }

              onChange={
                (event) =>
                  setTeamDraft(
                    (
                      currentDraft
                    ) => ({
                      ...currentDraft,

                      // O código já é convertido
                      // para maiúsculo enquanto
                      // o usuário digita.
                      code:
                        event
                          .target
                          .value
                          .toUpperCase(),
                    })
                  )
              }

              disabled={
                isLoading ||
                isSaving
              }

              placeholder="BRA"

              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold uppercase"
            />
          </label>

          {/* Nome completo da seleção */}
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-600">
              Nome
            </span>

            <input
              type="text"
              value={
                teamDraft.name
              }

              onChange={
                (event) =>
                  setTeamDraft(
                    (
                      currentDraft
                    ) => ({
                      ...currentDraft,

                      name:
                        event
                          .target
                          .value,
                    })
                  )
              }

              disabled={
                isLoading ||
                isSaving
              }

              placeholder="Brasil"

              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </label>

          {/* URL opcional do logo */}
          <label className="space-y-1">
            <span className="text-xs font-bold text-slate-600">
              Logo opcional
            </span>

            <input
              type="text"

              // Quando logo for null,
              // o input recebe uma string vazia.
              value={
                teamDraft.logo ||
                ''
              }

              onChange={
                (event) =>
                  setTeamDraft(
                    (
                      currentDraft
                    ) => ({
                      ...currentDraft,

                      logo:
                        event
                          .target
                          .value,
                    })
                  )
              }

              disabled={
                isLoading ||
                isSaving
              }

              placeholder="https://..."

              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </label>

          {/* Botão que adiciona a seleção
              à lista local */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={
                handleAddTeam
              }
              disabled={
                isLoading ||
                isSaving
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-400 md:w-auto"
            >
              <Plus className="h-4 w-4" />

              Adicionar
            </button>
          </div>
        </div>

        {/* Renderização condicional:
            mostra a lista quando existem seleções;
            caso contrário, mostra o estado vazio. */}
        {
          settings
            .eligibleTeams
            .length > 0
            ? (
                <div className="mt-4 space-y-2">
                  {
                    settings
                      .eligibleTeams
                      .map(
                        (team) => (
                          <div
                            key={team.code}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {/* Se existir logo,
                                  mostra a imagem.

                                  Caso contrário,
                                  mostra o código da seleção. */}
                              {
                                team.logo
                                  ? (
                                      <img
                                        src={
                                          team.logo
                                        }
                                        alt={
                                          team.name
                                        }
                                        className="h-8 w-8 shrink-0 object-contain"

                                        // Faz a imagem carregar
                                        // apenas quando estiver
                                        // próxima da área visível.
                                        loading="lazy"
                                      />
                                    )
                                  : (
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-700">
                                        {
                                          team.code
                                        }
                                      </div>
                                    )
                              }

                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {
                                    team.name
                                  }
                                </p>

                                <p className="text-xs font-semibold text-slate-500">
                                  {
                                    team.code
                                  }
                                </p>
                              </div>
                            </div>

                            {/* Remove a seleção
                                apenas do estado local.

                                É necessário salvar
                                depois para atualizar
                                o Firestore. */}
                            <button
                              type="button"
                              onClick={
                                () =>
                                  handleRemoveTeam(
                                    team.code
                                  )
                              }
                              disabled={
                                isLoading ||
                                isSaving
                              }
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:text-slate-400"
                              title="Remover seleção"
                              aria-label={
                                `Remover ${team.name}`
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )
                      )
                  }
                </div>
              )
            : (
                // Mensagem exibida quando
                // nenhuma seleção foi cadastrada.
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center">
                  <p className="text-sm font-bold text-slate-700">
                    Nenhuma seleção cadastrada ainda.
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Cadastre as seleções manualmente quando chegar o mata-mata.
                  </p>
                </div>
              )
        }
      </div>

      {/* Botão que salva toda
          a configuração no banco */}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            isLoading ||
            isSaving
          }
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 disabled:bg-slate-400"
        >
          <Save className="h-4 w-4" />

          {
            isSaving
              ? 'Salvando...'
              : 'Salvar configuração'
          }
        </button>
      </div>
    </div>
  );
}