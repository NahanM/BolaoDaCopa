import type {
  AdminToastState,
} from './types';

// Define as informações que o componente
// recebe do componente pai.
interface AdminToastProps {
  // O toast pode conter uma mensagem
  // ou ser null quando não deve aparecer.
  toast:
    AdminToastState | null;
}

// Escolhe a cor do pequeno indicador
// conforme o tipo da mensagem.
//
// O tipo é obtido diretamente da propriedade
// type de AdminToastState.
function getToastDotClassName(
  type: AdminToastState['type']
): string {
  if (type === 'error') {
    return 'bg-red-400';
  }

  if (type === 'info') {
    return 'bg-blue-400';
  }

  // Qualquer outro tipo permitido
  // utiliza a cor verde de sucesso.
  return 'bg-emerald-400';
}

// Exibe uma notificação flutuante
// no canto inferior direito da tela.
//
// Este componente:
// - não possui estado próprio;
// - não controla a duração da mensagem;
// - não cria nem altera o toast;
// - apenas mostra o valor recebido pela prop.
export function AdminToast({
  toast,
}: AdminToastProps) {
  // Quando não existe toast,
  // não renderiza nenhum elemento na tela.
  if (!toast) {
    return null;
  }

  // Obtém a classe de cor correspondente
  // ao tipo da mensagem atual.
  const dotClassName =
    getToastDotClassName(
      toast.type
    );

  return (
    // Caixa principal da notificação.
    //
    // fixed:
    // mantém o elemento fixo na tela.
    //
    // bottom-6 e right-6:
    // posicionam no canto inferior direito.
    //
    // z-50:
    // deixa o toast acima da maioria
    // dos outros elementos da página.
    //
    // max-w-[calc(100vw-2rem)]:
    // evita que a caixa ultrapasse
    // a largura disponível no celular.
    <div className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-white shadow-2xl animate-slide-up">
      {/* Indicador visual do tipo da mensagem.
      
          A classe de cor é inserida dinamicamente
          usando template string. */}
      <div
        className={
          `h-2.5 w-2.5 rounded-full ${dotClassName}`
        }
      />

      {/* Texto da notificação */}
      <span className="text-xs font-bold">
        {toast.message}
      </span>
    </div>
  );
}