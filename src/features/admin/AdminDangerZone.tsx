import {
  useState,
} from 'react';

import {
  RotateCcw,
} from 'lucide-react';

// Define as informações e funções
// que o componente recebe do componente pai.
interface AdminDangerZoneProps {
  // Função responsável por executar
  // a sincronização da tabela padrão de jogos.
  //
  // A função pode ser síncrona, retornando void,
  // ou assíncrona, retornando uma Promise.
  onSyncDefaultMatches:
    () => void | Promise<void>;

  // Callback usado para exibir
  // uma mensagem de sucesso.
  onSuccess: (
    message: string
  ) => void;

  // Callback usado para exibir
  // uma mensagem de erro.
  onError: (
    message: string
  ) => void;
}

// Área administrativa responsável
// por sincronizar novamente a tabela base
// de partidas do projeto.
//
// Este componente não acessa diretamente
// o Firebase.
//
// Ele apenas pede confirmação ao usuário
// e chama onSyncDefaultMatches,
// que foi recebida do componente pai.
export function AdminDangerZone({
  onSyncDefaultMatches,
  onSuccess,
  onError,
}: AdminDangerZoneProps) {
  // Indica se a sincronização
  // está acontecendo neste momento.
  //
  // Enquanto for true:
  // - o botão fica desabilitado;
  // - o texto do botão muda;
  // - novos cliques são impedidos.
  const [
    isSyncing,
    setIsSyncing,
  ] = useState(false);

  // Executa quando o administrador
  // clica no botão de sincronização.
  const handleSyncClick = async () => {
    // window.confirm abre uma caixa
    // de confirmação do navegador.
    //
    // O resultado será:
    //
    // true:
    // o usuário confirmou.
    //
    // false:
    // o usuário cancelou.
    const confirmed =
      window.confirm(
        'Sincronizar a tabela base de jogos? ' +
        'Jogos adicionados manualmente, participantes ' +
        'e palpites serão preservados.'
      );

    // Se o administrador cancelar,
    // interrompe a função sem sincronizar.
    if (!confirmed) {
      return;
    }

    try {
      // Marca que a sincronização começou.
      //
      // Isso também provoca uma nova renderização,
      // mudando o botão para o estado de carregamento.
      setIsSyncing(true);

      // Executa a sincronização real.
      //
      // A implementação dessa função
      // está fora deste componente.
      await onSyncDefaultMatches();

      // Só mostra a mensagem de sucesso
      // quando a operação termina sem erro.
      onSuccess(
        'Tabela base sincronizada sem apagar ' +
        'jogos manuais nem palpites.'
      );
    } catch (error) {
      // Registra o erro completo no console
      // para auxiliar durante o desenvolvimento.
      console.warn(
        'Erro ao sincronizar jogos:',
        error
      );

      // Mostra ao usuário uma mensagem
      // mais simples e compreensível.
      onError(
        'Não foi possível sincronizar ' +
        'os jogos no banco agora.'
      );
    } finally {
      // finally executa tanto em sucesso
      // quanto em erro.
      //
      // Ao finalizar, libera novamente o botão.
      setIsSyncing(false);
    }
  };

  return (
    // Card principal da área de sincronização.
    <section className="app-card app-card-padding">
      {/* No celular, o conteúdo fica em coluna.

          A partir do breakpoint sm,
          texto e botão ficam lado a lado. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Título e explicação da ação */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-tight text-slate-900">
            Sincronização dos jogos
          </h3>

          <p className="mt-1 max-w-xl text-xs text-slate-500">
            Atualiza a coleção de jogos com a tabela padrão do código e mantém
            jogos adicionados manualmente, participantes e palpites salvos no
            banco.
          </p>
        </div>

        {/* Botão que inicia a sincronização */}
        <button
          type="button"

          // Chama a função de confirmação
          // e sincronização.
          onClick={handleSyncClick}

          // Impede novos cliques enquanto
          // a operação ainda está acontecendo.
          disabled={isSyncing}

          className="app-button-secondary flex shrink-0 items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" />

          <span>
            {/* O texto muda de acordo
                com o estado da operação. */}
            {isSyncing
              ? 'Sincronizando...'
              : 'Sincronizar jogos'}
          </span>
        </button>
      </div>
    </section>
  );
}