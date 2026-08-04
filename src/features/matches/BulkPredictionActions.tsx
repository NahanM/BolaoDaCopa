import {
  Send,
} from 'lucide-react';

// Define as ações que este componente
// recebe do componente pai.
interface BulkPredictionActionsProps {
  // Executa a ação de copiar
  // todos os palpites preparados.
  //
  // Este componente não decide:
  // - quais palpites entram;
  // - como o texto é montado;
  // - como a área de transferência é acessada.
  onCopyAll: () => void;

  // Executa a ação de compartilhar
  // os palpites pelo WhatsApp.
  //
  // A montagem do texto e a abertura
  // do WhatsApp acontecem fora
  // deste componente.
  onShareAllWhatsApp: () => void;
}

// Exibe as ações em lote
// relacionadas aos palpites.
//
// O componente apenas apresenta
// os botões e comunica os cliques.
//
// Ele não recebe diretamente:
// - partidas;
// - jogadores;
// - palpites;
// - estado de autenticação.
export function BulkPredictionActions({
  onCopyAll,
  onShareAllWhatsApp,
}: BulkPredictionActionsProps) {
  return (
    // Container dos dois botões.
    //
    // w-full:
    // ocupa toda a largura no celular.
    //
    // sm:w-auto:
    // em telas maiores, utiliza somente
    // o espaço necessário.
    <div className="flex w-full gap-2 sm:w-auto">
      {/* Ação de copiar todos os palpites */}
      <button
        type="button"

        // A função vem do componente pai.
        //
        // Ao clicar, este componente
        // apenas chama a função recebida.
        onClick={onCopyAll}

        className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-900 sm:flex-initial"
      >
        <span>
          Copiar todos
        </span>
      </button>

      {/* Ação de compartilhar
          os palpites pelo WhatsApp */}
      <button
        type="button"
        onClick={onShareAllWhatsApp}

        className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[#25D366] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#20ba59] sm:flex-initial"
      >
        <Send className="h-3.5 w-3.5" />

        <span>
          Enviar no WhatsApp
        </span>
      </button>
    </div>
  );
}