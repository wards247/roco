import {
  getVisibleOwnedGendersByBaseId,
  getVisibleOwnedGendersForBaseIds,
  hasVisibleOwnedGenderForBaseIds,
} from './ownedGenders';
import type { MyPokemon } from '../types';

const ownedPokemon = [
  { base_id: 3350, egg_group_id: 1, gender: 'female', is_mine: true },
  { base_id: 3350, egg_group_id: 1, gender: 'male', is_mine: true },
  { base_id: 3205, egg_group_id: 1, gender: 'unknown', is_mine: true },
] satisfies MyPokemon[];

const ownedGenders = getVisibleOwnedGendersByBaseId(ownedPokemon);

if (ownedGenders.get(3350)?.join(',') !== 'male,female') {
  throw new Error('owned genders should show male and female markers in a stable order');
}

if (ownedGenders.has(3205)) {
  throw new Error('unknown gender should not create a visible owned marker');
}

const relatedOwnedPokemon = [
  { base_id: 3383, egg_group_id: 13, gender: 'female', is_mine: true },
] satisfies MyPokemon[];

const relatedOwnedGenders = getVisibleOwnedGendersForBaseIds(relatedOwnedPokemon, [3382, 3383]);

if (relatedOwnedGenders.join(',') !== 'female') {
  throw new Error('owned genders should match related family base ids');
}

if (!hasVisibleOwnedGenderForBaseIds(relatedOwnedPokemon, [3382, 3383])) {
  throw new Error('owned status should be true when any related base id has a visible gender');
}

if (hasVisibleOwnedGenderForBaseIds(ownedPokemon, [3205])) {
  throw new Error('unknown gender should not count as owned for shiny ordering');
}
