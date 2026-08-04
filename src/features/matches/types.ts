// Reexporta o tipo responsável
// por representar os filtros disponíveis.
//
// A declaração original permanece em:
//
// domain/matchFilters.ts
//
// Este arquivo apenas oferece
// um caminho de importação mais próximo
// para os componentes da feature matches.
export type {
  MatchFilter,
} from '../../domain/matchFilters';

// Representa qual lado do palpite
// está sendo alterado.
//
// "A":
// placar do primeiro time.
//
// "B":
// placar do segundo time.
export type PredictionSide =
  | 'A'
  | 'B';