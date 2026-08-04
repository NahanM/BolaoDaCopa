// Dados e ação recebidos
// pelo aviso de conexão.
interface OfflineBannerProps {
  // Solicita ao componente pai
  // uma nova tentativa de conexão.
  //
  // Este componente não sabe:
  //
  // - como o Firestore será reconectado;
  // - se a tentativa funcionou;
  // - quando o banner deve desaparecer.
  onReconnect: () => void;
}

// Aviso exibido quando a aplicação
// não consegue utilizar normalmente
// a conexão com o Firestore.
//
// O componente:
//
// - comunica o estado ao usuário;
// - alerta sobre possível falta de sincronização;
// - oferece uma tentativa manual.
//
// Ele não controla diretamente
// a conexão nem o Firestore.
export function OfflineBanner({
  onReconnect,
}: OfflineBannerProps) {
  return (
    // role="status" e aria-live permitem
    // que tecnologias assistivas anunciem
    // o aviso quando ele surgir na tela.
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Mensagem principal */}
        <div className="flex items-start gap-2">
          {/* Indicador visual de alerta.

              Ele é decorativo, pois a mensagem
              textual já explica o estado. */}
          <span
            aria-hidden="true"
            className="relative mt-1.5 flex h-2 w-2 shrink-0"
          >
            {/* Círculo externo animado */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />

            {/* Círculo central */}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>

          <p className="leading-relaxed">
            <strong>
              Modo local ativo:
            </strong>{' '}

            não conseguimos conectar ao Firestore agora. Alterações feitas aqui
            podem não sincronizar com o banco.
          </p>
        </div>

        {/* Solicita uma nova tentativa
            de conexão ao componente pai. */}
        <button
          type="button"
          onClick={onReconnect}
          className="self-start rounded-lg border border-amber-300 bg-white px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-amber-900 shadow-sm transition hover:bg-amber-100 sm:self-auto"
        >
          Tentar reconectar
        </button>
      </div>
    </div>
  );
}