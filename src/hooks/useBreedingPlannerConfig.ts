import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { MyPokemon } from '../types';
import {
  getPlannerPokemonKey,
  mergeBreedingPlannerConfigWithPokemon,
  sanitizeBreedingPlannerConfig,
} from '../utils/breedingPlanner';
import type {
  BreedingPlannerConfig,
  BreedingPlannerEntryConfig,
  PlannerGender,
} from '../utils/breedingPlanner';

const STORAGE_KEY = 'roco_breeding_planner_config';

const DEFAULT_CONFIG_SNAPSHOT = JSON.stringify(sanitizeBreedingPlannerConfig(null));

const readStoredConfig = (storageKey: string): BreedingPlannerConfig => {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return sanitizeBreedingPlannerConfig(null);
  }

  try {
    return sanitizeBreedingPlannerConfig(JSON.parse(stored));
  } catch {
    return sanitizeBreedingPlannerConfig(null);
  }
};

const subscribe = (storageEvent: string, onStoreChange: () => void) => {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(storageEvent, onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(storageEvent, onStoreChange);
  };
};

const getStorageEvent = (storageKey: string) => `${storageKey}_changed`;

const getSnapshot = (storageKey: string) => JSON.stringify(readStoredConfig(storageKey));

const writeStoredConfig = (storageKey: string, config: BreedingPlannerConfig) => {
  localStorage.setItem(storageKey, JSON.stringify(sanitizeBreedingPlannerConfig(config)));
  window.dispatchEvent(new Event(getStorageEvent(storageKey)));
};

export const useBreedingPlannerConfig = (
  pokemon: MyPokemon[],
  storageKey = STORAGE_KEY,
  defaultEntry: BreedingPlannerEntryConfig = { enabled: true, count: 1 },
) => {
  const storageEvent = getStorageEvent(storageKey);
  const snapshot = useSyncExternalStore(
    (onStoreChange) => subscribe(storageEvent, onStoreChange),
    () => getSnapshot(storageKey),
    () => DEFAULT_CONFIG_SNAPSHOT,
  );
  const storedConfig = useMemo(
    () => sanitizeBreedingPlannerConfig(JSON.parse(snapshot)),
    [snapshot],
  );
  const config = useMemo(
    () => mergeBreedingPlannerConfigWithPokemon(pokemon, storedConfig, defaultEntry),
    [defaultEntry, pokemon, storedConfig],
  );

  const updateNestCount = useCallback((nestCount: number) => {
    writeStoredConfig(storageKey, { ...readStoredConfig(storageKey), nestCount });
  }, [storageKey]);

  const updateEntry = useCallback(
    (
      baseId: number,
      gender: PlannerGender,
      patch: Partial<BreedingPlannerEntryConfig>,
    ) => {
      const previous = readStoredConfig(storageKey);
      const key = getPlannerPokemonKey(baseId, gender);
      const entry = previous.entries[key] ?? { enabled: true, count: 1 };

      writeStoredConfig(storageKey, {
        ...previous,
        entries: {
          ...previous.entries,
          [key]: { ...entry, ...patch },
        },
      });
    },
    [storageKey],
  );

  const setAllEnabled = useCallback((enabled: boolean, visiblePokemon: MyPokemon[]) => {
    const previous = readStoredConfig(storageKey);
    const entries = { ...previous.entries };

    visiblePokemon.forEach((owned) => {
      if (owned.gender !== 'male' && owned.gender !== 'female') {
        return;
      }

      const key = getPlannerPokemonKey(owned.base_id, owned.gender);
      entries[key] = {
        ...(entries[key] ?? { enabled: true, count: 1 }),
        enabled,
      };
    });

    writeStoredConfig(storageKey, { ...previous, entries });
  }, [storageKey]);

  return {
    config,
    updateNestCount,
    updateEntry,
    setAllEnabled,
  };
};
