import type { Gender, MyPokemon } from '../types';

const visibleGenderOrder: Gender[] = ['male', 'female'];

export const getVisibleOwnedGendersByBaseId = (ownedPokemon: MyPokemon[]) => {
  const ownedBaseIdsByGender = new Map<number, Set<Gender>>();

  ownedPokemon.forEach((pokemon) => {
    if (!visibleGenderOrder.includes(pokemon.gender)) {
      return;
    }

    const ownedGenders = ownedBaseIdsByGender.get(pokemon.base_id) ?? new Set<Gender>();
    ownedGenders.add(pokemon.gender);
    ownedBaseIdsByGender.set(pokemon.base_id, ownedGenders);
  });

  return new Map(
    Array.from(ownedBaseIdsByGender, ([baseId, ownedGenders]) => [
      baseId,
      visibleGenderOrder.filter((gender) => ownedGenders.has(gender)),
    ]),
  );
};

export const getVisibleOwnedGendersForBaseIds = (ownedPokemon: MyPokemon[], baseIds: number[]) => {
  const baseIdSet = new Set(baseIds);
  const ownedGenders = new Set<Gender>();

  ownedPokemon.forEach((pokemon) => {
    if (baseIdSet.has(pokemon.base_id) && visibleGenderOrder.includes(pokemon.gender)) {
      ownedGenders.add(pokemon.gender);
    }
  });

  return visibleGenderOrder.filter((gender) => ownedGenders.has(gender));
};

export const hasVisibleOwnedGenderForBaseIds = (ownedPokemon: MyPokemon[], baseIds: number[]) =>
  getVisibleOwnedGendersForBaseIds(ownedPokemon, baseIds).length > 0;
