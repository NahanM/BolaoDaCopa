import {
  AlertCircle,
} from 'lucide-react';

// Exibe um aviso visual sobre
// a regra de bloqueio dos palpites.
//
// Este componente:
// - não recebe propriedades;
// - não possui estado;
// - não acessa serviços;
// - apenas renderiza uma mensagem fixa.
export function AdminRuleNotice() {
  return (
    // Caixa principal do aviso.
    //
    // As classes definem:
    // - fundo amarelo claro;
    // - borda amarela;
    // - cantos arredondados;
    // - espaçamento interno;
    // - conteúdo alinhado horizontalmente.
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      {/* Ícone visual do aviso.
      
          shrink-0 impede que o ícone diminua
          quando o texto ocupar mais espaço.
          
          mt-0.5 aplica um pequeno ajuste vertical
          para alinhar melhor o ícone ao texto. */}
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

      {/* Agrupa o título e a descrição.
      
          space-y-1 adiciona um pequeno espaço
          vertical entre os elementos internos. */}
      <div className="space-y-1">
        {/* Título do aviso */}
        <h4 className="text-xs font-bold uppercase text-amber-800">
          Regra dos palpites
        </h4>

        {/* Explicação da regra exibida
            para o administrador. */}
        <p className="text-xs leading-relaxed text-amber-700">
          Os palpites devem ser salvos antes do início de cada partida. Depois
          do horário do jogo, os palpites ficam travados no sistema.
        </p>
      </div>
    </div>
  );
}