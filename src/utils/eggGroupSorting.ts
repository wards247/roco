import type { Pokemon } from '../types';

export const sortPokemonByBaseId = (pokemonList: Pokemon[]): Pokemon[] =>
  [...pokemonList].sort((left, right) => left.base_id - right.base_id);
