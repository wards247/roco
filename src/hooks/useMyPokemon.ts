import { useCallback, useSyncExternalStore } from 'react';
import type { Gender, MyPokemon } from '../types';

const STORAGE_KEY = 'roco_my_pokemon';
const STORAGE_EVENT = 'roco_my_pokemon_changed';

const readStoredPokemon = (): MyPokemon[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
  };
};

const getSnapshot = () => JSON.stringify(readStoredPokemon());

const writeStoredPokemon = (data: MyPokemon[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const useMyPokemon = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '[]');
  const myPokemon = JSON.parse(snapshot) as MyPokemon[];

  const addPokemon = useCallback(
    (
      baseId: number,
      eggGroupId: number,
      displayName?: string,
      avatarUrl?: string,
      gender: Gender = 'female',
    ) => {
      const previous = readStoredPokemon();
      if (previous.some((pokemon) => pokemon.base_id === baseId && pokemon.gender === gender)) {
        return;
      }

      writeStoredPokemon([
        ...previous,
        {
          base_id: baseId,
          egg_group_id: eggGroupId,
          can_hatch: true,
          gender,
          is_mine: true,
          display_name: displayName,
          avatar_url: avatarUrl,
        },
      ]);
    },
    [],
  );

  const addPokemonWithGenders = useCallback(
    (
      baseId: number,
      eggGroupId: number,
      genders: Gender[],
      displayName?: string,
      avatarUrl?: string,
      eggGroupIds: number[] = [eggGroupId],
    ) => {
      const previous = readStoredPokemon();
      const next = [...previous];

      genders.forEach((gender) => {
        if (next.some((pokemon) => pokemon.base_id === baseId && pokemon.gender === gender)) {
          return;
        }

        next.push({
          base_id: baseId,
          egg_group_id: eggGroupId,
          egg_group_ids: eggGroupIds,
          can_hatch: true,
          gender,
          is_mine: true,
          display_name: displayName,
          avatar_url: avatarUrl,
        });
      });

      writeStoredPokemon(next);
    },
    [],
  );

  const updateGender = useCallback(
    (baseId: number, gender: Gender, previousGender?: Gender) => {
      const next = readStoredPokemon().map((pokemon) =>
        pokemon.base_id === baseId && (!previousGender || pokemon.gender === previousGender)
          ? { ...pokemon, gender }
          : pokemon,
      );
      writeStoredPokemon(next);
    },
    [],
  );

  const removePokemon = useCallback(
    (baseId: number, gender?: Gender) => {
      writeStoredPokemon(
        readStoredPokemon().filter(
          (pokemon) => pokemon.base_id !== baseId || (gender && pokemon.gender !== gender),
        ),
      );
    },
    [],
  );

  const getMyPokemonMap = useCallback(() => {
    const ownedMap = new Map<number, MyPokemon[]>();
    myPokemon.forEach((pokemon) => {
      ownedMap.set(pokemon.base_id, [...(ownedMap.get(pokemon.base_id) || []), pokemon]);
    });
    return ownedMap;
  }, [myPokemon]);

  return {
    myPokemon,
    loading: false,
    addPokemon,
    addPokemonWithGenders,
    updateGender,
    removePokemon,
    getMyPokemonMap,
  };
};
