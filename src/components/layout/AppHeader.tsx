import {
  useEffect,
  useState,
} from 'react';

import type {
  FormEvent,
} from 'react';

import type {
  User as FirebaseUser,
} from 'firebase/auth';

import {
  BadgeDollarSign,
  Check,
  Loader2,
  LogOut,
  Pencil,
  X,
} from 'lucide-react';

import {
  AVAILABLE_AVATARS,
  DEFAULT_AVATAR,
} from '../../config/avatars';

// Limite aceito para o nome
// exibido no ranking.
const MAX_PROFILE_NAME_LENGTH = 128;

// Dados e ações recebidos
// pelo cabeçalho principal.
interface AppHeaderProps {
  // Usuário autenticado no Firebase.
  //
  // null significa que ninguém
  // está autenticado.
  currentUser: FirebaseUser | null;

  // Nome salvo no perfil
  // do participante do bolão.
  displayName?: string;

  // Avatar escolhido dentro
  // da aplicação.
  avatar?: string;

  // Pontuação atual do participante.
  points: number;

  // Valor total estimado
  // da premiação.
  totalPrizePool: number;

  // Indica se o perfil do jogador
  // já está disponível para edição.
  canEditProfile: boolean;

  // Mostra o botão de login para
  // quem não está autenticado.
  showLogin?: boolean;

  // Mostra o botão que abre
  // a edição de perfil.
  showProfileEditor?: boolean;

  // Solicita autenticação com Google.
  onLogin: () => void;

  // Solicita encerramento da sessão.
  onLogout: () => void;

  // Salva as alterações do perfil.
  //
  // A Promise deve resolver somente
  // quando a operação terminar com sucesso.
  onUpdateProfile: (
    name: string,
    avatar: string
  ) => Promise<void>;
}

// Cabeçalho principal da aplicação.
//
// Ele apresenta:
//
// - nome e identidade do sistema;
// - prêmio estimado;
// - autenticação;
// - participante atual;
// - pontuação;
// - edição de perfil.
export function AppHeader({
  currentUser,
  displayName,
  avatar,
  points,
  totalPrizePool,
  canEditProfile,
  showLogin = true,
  showProfileEditor = true,
  onLogin,
  onLogout,
  onUpdateProfile,
}: AppHeaderProps) {
  // Prioridade para o nome:
  //
  // 1. nome do perfil no bolão;
  // 2. nome da conta Google;
  // 3. texto padrão.
  const resolvedName =
    displayName ||
    currentUser?.displayName ||
    'Jogador';

  // Quando o participante ainda
  // não escolheu um avatar,
  // utiliza o avatar padrão.
  const resolvedAvatar =
    avatar ||
    DEFAULT_AVATAR;

  // Controla a exibição
  // do editor de perfil.
  const [
    isEditingProfile,
    setIsEditingProfile,
  ] = useState(false);

  // Valores temporários do formulário.
  //
  // Alterá-los não modifica imediatamente
  // o perfil salvo no banco.
  const [
    draftName,
    setDraftName,
  ] = useState(resolvedName);

  const [
    draftAvatar,
    setDraftAvatar,
  ] = useState(resolvedAvatar);

  // Mensagem de validação
  // ou falha no salvamento.
  const [
    profileError,
    setProfileError,
  ] = useState('');

  // Impede ações duplicadas
  // enquanto o perfil é salvo.
  const [
    isSavingProfile,
    setIsSavingProfile,
  ] = useState(false);

  // Mantém os rascunhos sincronizados
  // com os dados externos enquanto
  // o formulário não estiver aberto.
  //
  // Durante uma edição, não atualiza
  // os campos para evitar apagar
  // o que o usuário está digitando.
  useEffect(() => {
    if (isEditingProfile) {
      return;
    }

    setDraftName(
      resolvedName
    );

    setDraftAvatar(
      resolvedAvatar
    );

    setProfileError('');
  }, [
    isEditingProfile,
    resolvedAvatar,
    resolvedName,
  ]);

  // Fecha o editor e descarta
  // alterações ainda não salvas.
  const closeProfileEditor = () => {
    // Não permite fechar enquanto
    // a gravação está em andamento.
    if (isSavingProfile) {
      return;
    }

    setIsEditingProfile(false);
    setDraftName(resolvedName);
    setDraftAvatar(resolvedAvatar);
    setProfileError('');
  };

  // Valida e salva o perfil.
  const handleSubmitProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    // Impede que o navegador
    // recarregue a página.
    event.preventDefault();

    // Remove espaços antes e depois
    // do nome digitado.
    const trimmedName =
      draftName.trim();

    if (!trimmedName) {
      setProfileError(
        'Digite um nome para aparecer no ranking.'
      );

      return;
    }

    if (
      trimmedName.length >
      MAX_PROFILE_NAME_LENGTH
    ) {
      setProfileError(
        `Use um nome com até ${MAX_PROFILE_NAME_LENGTH} caracteres.`
      );

      return;
    }

    // Confirma que o avatar selecionado
    // realmente pertence à lista permitida.
    const isValidAvatar =
      AVAILABLE_AVATARS.some(
        (option) =>
          option === draftAvatar
      );

    if (!isValidAvatar) {
      setProfileError(
        'Escolha uma foto de perfil da lista.'
      );

      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileError('');

      // O salvamento real acontece
      // no componente pai ou service.
      await onUpdateProfile(
        trimmedName,
        draftAvatar
      );

      // Fecha somente depois
      // da confirmação de sucesso.
      setIsEditingProfile(false);
    } catch (error) {
      console.warn(
        'Erro ao atualizar perfil:',
        error
      );

      setProfileError(
        'Não consegui salvar no banco agora. Confira a conexão e tente novamente.'
      );
    } finally {
      // Executado tanto em sucesso
      // quanto em erro.
      setIsSavingProfile(false);
    }
  };

  return (
    <header className="shrink-0 border-b border-[#0a5a40] bg-[#063f2d] px-4 py-4 shadow-sm md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Identidade da aplicação */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white shadow-sm">
            <BadgeDollarSign className="h-6 w-6" />
          </div>

          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Gestão de palpites
            </p>

            <h1 className="text-xl font-black leading-tight tracking-tight text-white md:text-2xl">
              Bolão da Copa
            </h1>

            <p className="mt-1 max-w-xl text-sm text-emerald-50/80">
              Copa 2026, ranking ao vivo e conferência dos palpites.
            </p>
          </div>
        </div>

        {/* Prêmio e autenticação */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end">
          {/* Valor atual da premiação */}
          <div className="text-left md:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-100/80">
              Prêmio estimado
            </p>

            <p className="text-xl font-black text-white">
              R$ {totalPrizePool.toFixed(2)}
            </p>
          </div>

          {/* Usuário autenticado */}
          {currentUser
            ? (
                <div className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 sm:w-auto sm:gap-3">
                  {/* Avatar */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white text-xl">
                    {resolvedAvatar}
                  </span>

                  {/* Nome e pontos */}
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <p className="text-[10px] font-bold uppercase text-emerald-100/70">
                      Logado
                    </p>

                    <div className="flex items-center gap-2">
                      <span className="block max-w-[110px] truncate text-xs font-bold text-white sm:max-w-[120px]">
                        {resolvedName}
                      </span>

                      <span className="rounded border border-emerald-200 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950">
                        {points} pts
                      </span>
                    </div>
                  </div>

                  {/* Abrir edição de perfil */}
                  {showProfileEditor && (
                    <button
                      type="button"

                      onClick={
                        () =>
                          setIsEditingProfile(
                            true
                          )
                      }

                      disabled={
                        !canEditProfile
                      }

                      title={
                        canEditProfile
                          ? 'Editar nome e foto'
                          : 'Aguarde sincronizar seu perfil'
                      }

                      aria-label="Editar nome e foto"

                      className="shrink-0 rounded-lg p-1.5 text-emerald-50/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* Encerrar sessão */}
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sair da conta"
                    aria-label="Sair da conta"
                    className="shrink-0 rounded-lg p-1.5 text-emerald-50/70 transition hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              )
            : showLogin && (
                // Usuário não autenticado.
                <button
                  type="button"
                  onClick={onLogin}
                  className="app-button-primary flex w-full items-center justify-center gap-2 text-xs sm:w-auto"
                >
                  <span className="font-black">
                    G
                  </span>

                  <span>
                    Entrar com Google
                  </span>
                </button>
              )}
        </div>
      </div>

      {/* Modal de edição do perfil.

          Ele só existe quando:

          - há usuário autenticado;
          - o usuário abriu o editor. */}
      {currentUser &&
        isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
            <form
              onSubmit={handleSubmitProfile}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-editor-title"
              className="w-full max-w-sm rounded-xl border border-emerald-900/10 bg-white p-5 shadow-2xl"
            >
              {/* Cabeçalho do modal */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                    Meu perfil
                  </p>

                  <h2
                    id="profile-editor-title"
                    className="font-display text-lg font-black text-slate-950"
                  >
                    Editar nome e foto
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeProfileEditor}
                  disabled={isSavingProfile}
                  title="Fechar"
                  aria-label="Fechar editor de perfil"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nome no ranking */}
              <label className="block">
                <span className="app-label">
                  Nome no ranking
                </span>

                <input
                  type="text"
                  value={draftName}
                  maxLength={MAX_PROFILE_NAME_LENGTH}

                  onChange={
                    (event) =>
                      setDraftName(
                        event.target.value
                      )
                  }

                  className="app-input"
                  placeholder="Seu nome"
                  disabled={isSavingProfile}
                />
              </label>

              {/* Escolha do avatar */}
              <div className="mt-4">
                <p className="app-label">
                  Foto de perfil
                </p>

                <div
                  role="group"
                  aria-label="Escolher foto de perfil"
                  className="grid grid-cols-5 gap-2"
                >
                  {AVAILABLE_AVATARS.map(
                    (option) => {
                      const isSelected =
                        draftAvatar === option;

                      return (
                        <button
                          key={option}
                          type="button"

                          onClick={
                            () =>
                              setDraftAvatar(
                                option
                              )
                          }

                          disabled={
                            isSavingProfile
                          }

                          title={`Usar ${option}`}
                          aria-label={`Usar avatar ${option}`}
                          aria-pressed={isSelected}

                          className={
                            `flex aspect-square items-center justify-center ` +
                            `rounded-lg border text-xl transition ${
                              isSelected
                                ? (
                                    'border-[#087a4b] ' +
                                    'bg-emerald-50 ' +
                                    'ring-2 ' +
                                    'ring-[#087a4b]/20'
                                  )
                                : (
                                    'border-slate-200 ' +
                                    'bg-slate-50 ' +
                                    'hover:border-emerald-300 ' +
                                    'hover:bg-emerald-50'
                                  )
                            } disabled:opacity-60`
                          }
                        >
                          {option}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Erro de validação
                  ou salvamento */}
              {profileError && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {profileError}
                </p>
              )}

              {/* Ações do formulário */}
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProfileEditor}
                  disabled={isSavingProfile}
                  className="app-button-secondary text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="app-button-primary flex items-center gap-2 text-xs disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {/* Mostra animação enquanto salva
                      e ícone normal quando parado. */}
                  {isSavingProfile
                    ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )
                    : (
                        <Check className="h-4 w-4" />
                      )}

                  <span>
                    {isSavingProfile
                      ? 'Salvando...'
                      : 'Salvar'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
    </header>
  );
}