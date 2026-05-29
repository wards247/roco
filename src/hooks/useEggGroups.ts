import { useCallback } from 'react';
import eggGroupsData from '../data/egg-groups.json';
import type { EggGroup, Pokemon } from '../types';
import { sortPokemonByBaseId } from '../utils/eggGroupSorting';
import { toPublicAssetUrl } from '../utils/publicAssets';

const eggGroups: EggGroup[] = eggGroupsData.eggGroups.map((group) => ({
  ...group,
  member_count: group.member_count || 0,
  hatchable_member_count: group.hatchable_member_count || 0,
}));

const allPokemon: Pokemon[] = sortPokemonByBaseId(
  Object.entries(eggGroupsData.pokemonByGroup).flatMap(
    ([groupId, pokemonList]) =>
      pokemonList.map((pokemon) => ({
        ...pokemon,
        avatar_url: toPublicAssetUrl(pokemon.avatar_url),
        body_url: toPublicAssetUrl(pokemon.body_url),
        egg_group_id: Number(groupId),
      })),
  ),
);

const dedupePokemonByBaseId = (pokemonList: Pokemon[]) => {
  const seen = new Set<number>();
  return pokemonList.filter((pokemon) => {
    if (seen.has(pokemon.base_id)) {
      return false;
    }

    seen.add(pokemon.base_id);
    return true;
  });
};

export const useEggGroups = () => {
  const getPokemonByGroup = useCallback(
    (groupId: number): Pokemon[] => sortPokemonByBaseId(allPokemon.filter((pokemon) => pokemon.egg_group_id === groupId)),
    [],
  );

  const searchPokemon = useCallback(
    (query: string, groupId?: number | null): Pokemon[] => {
      let result = allPokemon;

      if (groupId) {
        result = result.filter((pokemon) => pokemon.egg_group_id === groupId);
      }

      if (query.trim()) {
        const normalizedQuery = query.trim().toLowerCase();
        result = result.filter(
          (pokemon) =>
            pokemon.display_name.toLowerCase().includes(normalizedQuery) ||
            pokemon.page_name.toLowerCase().includes(normalizedQuery) ||
            pokemon.family_chain.toLowerCase().includes(normalizedQuery),
        );
      }

      return sortPokemonByBaseId(groupId ? result : dedupePokemonByBaseId(result));
    },
    [],
  );

  return {
    eggGroups,
    allPokemon,
    loading: false,
    getPokemonByGroup,
    searchPokemon,
  };
};
