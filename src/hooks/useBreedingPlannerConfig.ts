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
const STORAGE_EVENT = 'roco_breeding_planner_config_changed';

const DEFAULT_CONFIG_SNAPSHOT = JSON.stringify(sanitizeBreedingPlannerConfig(null));

const readStoredConfig = (): BreedingPlannerConfig => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return sanitizeBreedingPlannerConfig(null);
  }

  try {
    return sanitizeBreedingPlannerConfig(JSON.parse(stored));
  } catch {
    return sanitizeBreedingPlannerConfig(null);
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

const getSnapshot = () => JSON.stringify(readStoredConfig());

const writeStoredConfig = (config: BreedingPlannerConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeBreedingPlannerConfig(config)));
  window.dispatchEvent(new Event(STORAGE_EVENT));
};

export const useBreedingPlannerConfig = (pokemon: MyPokemon[]) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_CONFIG_SNAPSHOT);
  const storedConfig = useMemo(
    () => sanitizeBreedingPlannerConfig(JSON.parse(snapshot)),
    [snapshot],
  );
  const config = useMemo(
    () => mergeBreedingPlannerConfigWithPokemon(pokemon, storedConfig),
    [pokemon, storedConfig],
  );

  const updateNestCount = useCallback((nestCount: number) => {
    writeStoredConfig({ ...readStoredConfig(), nestCount });
  }, []);

  const updateEntry = useCallback(
    (
      baseId: number,
      gender: PlannerGender,
      patch: Partial<BreedingPlannerEntryConfig>,
    ) => {
      const previous = readStoredConfig();
      const key = getPlannerPokemonKey(baseId, gender);
      const entry = previous.entries[key] ?? { enabled: true, count: 1 };

      writeStoredConfig({
        ...previous,
        entries: {
          ...previous.entries,
          [key]: { ...entry, ...patch },
        },
      });
    },
    [],
  );

  const setAllEnabled = useCallback((enabled: boolean, visiblePokemon: MyPokemon[]) => {
    const previous = readStoredConfig();
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

    writeStoredConfig({ ...previous, entries });
  }, []);

  return {
    config,
    updateNestCount,
    updateEntry,
    setAllEnabled,
  };
};
