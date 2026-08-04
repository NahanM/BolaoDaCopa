// Define os tipos de mensagem
// que podem aparecer no toast administrativo.
//
// success:
// operação concluída com sucesso.
//
// info:
// mensagem informativa.
//
// error:
// alguma operação falhou.
export type ToastType =
  | 'success'
  | 'info'
  | 'error';

// Representa o estado completo
// de uma notificação administrativa.
//
// Exemplo:
//
// {
//   message: 'Participante adicionado.',
//   type: 'success'
// }
export interface AdminToastState {
  // Texto que será exibido
  // dentro do toast.
  message: string;

  // Define o tipo da mensagem
  // e, consequentemente, sua aparência.
  type: ToastType;
}

// Representa o valor de um campo
// de placar enquanto ele está sendo digitado.
//
// O valor pode ser:
//
// number:
// quando existe um placar preenchido.
//
// '':
// quando o input está vazio.
//
// A string vazia é necessária porque
// inputs controlados do React precisam conseguir
// representar visualmente um campo sem valor.
export type ScoreInputValue =
  number | '';

// Representa os palpites iniciais
// digitados durante o cadastro
// de um novo participante.
//
// Record cria um objeto no formato:
//
// chave:
// ID da partida.
//
// valor:
// placar digitado para os dois times.
//
// Exemplo:
//
// {
//   "match-1": {
//     scoreA: 2,
//     scoreB: 1
//   },
//
//   "match-2": {
//     scoreA: '',
//     scoreB: 3
//   }
// }
export type NewPlayerPredictions =
  Record<
    string,
    {
      // Placar digitado
      // para o time A.
      scoreA: ScoreInputValue;

      // Placar digitado
      // para o time B.
      scoreB: ScoreInputValue;
    }
  >;