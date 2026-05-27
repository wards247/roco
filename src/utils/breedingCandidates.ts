import type { Pokemon } from '../types';
import type { MyPokemon } from '../types';

export interface LocalBreedingCandidate {
  pokemon: Pokemon;
  sharedEggGroupIds: number[];
}

export interface SystemBreedingRecommendation {
  pokemon: Pokemon;
  eggGroupIds: number[];
  compatiblePokemon: Pokemon[];
  compatibilityCount: number;
}

const getPokemonKey = (pokemon: Pokemon) => pokemon.family_key || String(pokemon.base_id);

export const getPokemonEntries = (allPokemon: Pokemon[], baseId: number) =>
  allPokemon.filter((pokemon) => pokemon.base_id === baseId);

export const getPokemonEggGroupIds = (pokemonEntries: Pokemon[]) =>
  [...new Set(pokemonEntries.map((pokemon) => pokemon.egg_group_id))];

export const getMyPokemonEggGroupIds = (pokemon: MyPokemon) =>
  pokemon.egg_group_ids && pokemon.egg_group_ids.length > 0
    ? pokemon.egg_group_ids
    : [pokemon.egg_group_id];

export const shareAnyEggGroup = (left: MyPokemon, right: MyPokemon) => {
  const rightEggGroupIds = new Set(getMyPokemonEggGroupIds(right));
  return getMyPokemonEggGroupIds(left).some((eggGroupId) => rightEggGroupIds.has(eggGroupId));
};

export const getLocalBreedingCandidates = (allPokemon: Pokemon[], baseId: number) => {
  const sourceEntries = getPokemonEntries(allPokemon, baseId);
  const sourceEggGroupIds = new Set(getPokemonEggGroupIds(sourceEntries));
  const seen = new Set<string>();

  return allPokemon.flatMap((pokemon): LocalBreedingCandidate[] => {
    if (pokemon.base_id === baseId || pokemon.hatch_status_text !== '可生蛋') {
      return [];
    }

    const sharedEggGroupIds = sourceEggGroupIds.has(pokemon.egg_group_id) ? [pokemon.egg_group_id] : [];
    if (sharedEggGroupIds.length === 0) {
      return [];
    }

    const key = getPokemonKey(pokemon);
    if (seen.has(key)) {
      return [];
    }

    seen.add(key);

    return [{ pokemon, sharedEggGroupIds }];
  });
};

export const getSystemBreedingRecommendations = (
  allPokemon: Pokemon[],
): SystemBreedingRecommendation[] => {
  const familyMap = new Map<string, { pokemon: Pokemon; eggGroupIds: Set<number> }>();

  allPokemon.forEach((pokemon) => {
    if (pokemon.hatch_status_text !== '可生蛋') {
      return;
    }

    const key = getPokemonKey(pokemon);
    const existing = familyMap.get(key);
    if (existing) {
      existing.eggGroupIds.add(pokemon.egg_group_id);
      return;
    }

    familyMap.set(key, {
      pokemon,
      eggGroupIds: new Set([pokemon.egg_group_id]),
    });
  });

  const families = [...familyMap.entries()];

  return families
    .map(([familyKey, family]) => {
      const compatiblePokemon = families.flatMap(([candidateKey, candidate]) => {
        if (candidateKey === familyKey) {
          return [];
        }

        const sharesEggGroup = [...family.eggGroupIds].some((eggGroupId) =>
          candidate.eggGroupIds.has(eggGroupId),
        );

        return sharesEggGroup ? [candidate.pokemon] : [];
      });

      return {
        pokemon: family.pokemon,
        eggGroupIds: [...family.eggGroupIds],
        compatiblePokemon,
        compatibilityCount: compatiblePokemon.length,
      };
    })
    .sort((left, right) => {
      if (right.compatibilityCount !== left.compatibilityCount) {
        return right.compatibilityCount - left.compatibilityCount;
      }

      return left.pokemon.display_name.localeCompare(right.pokemon.display_name, 'zh-Hans-CN');
    });
};
