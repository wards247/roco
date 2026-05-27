import { sortPokemonByBaseId } from './eggGroupSorting';
import type { Pokemon } from '../types';

const pokemon = [
  { base_id: 3006, display_name: '火神' },
  { base_id: 3003, display_name: '火花' },
  { base_id: 3032, display_name: '焰火' },
] as Pokemon[];

const sortedIds = sortPokemonByBaseId(pokemon).map((entry) => entry.base_id).join(',');

if (sortedIds !== '3003,3006,3032') {
  throw new Error('pokemon entries should sort by numeric base id');
}

if (pokemon[0].base_id !== 3006) {
  throw new Error('sorting should not mutate the original list');
}
