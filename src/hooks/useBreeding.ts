import { useMemo } from 'react';
import type { MyPokemon } from '../types';
import { shareAnyEggGroup } from '../utils/breedingCandidates';

export interface BreedingPair {
  pokemon: MyPokemon;
  compatiblePokemon: MyPokemon[];
  compatibilityCount: number;
  direction: 'female-to-male' | 'male-to-female';
}

export const useBreeding = (myPokemon: MyPokemon[]) => {
  const hatchablePokemon = useMemo(
    () => myPokemon.filter((pokemon) => pokemon.can_hatch !== false),
    [myPokemon],
  );

  const femaleRecommendations = useMemo(() => {
    const females = hatchablePokemon.filter((pokemon) => pokemon.gender === 'female');
    const males = hatchablePokemon.filter((pokemon) => pokemon.gender === 'male');

    return females
      .map((female) => {
        const compatibleMales = males.filter(
          (male) => shareAnyEggGroup(female, male) && male.base_id !== female.base_id,
        );

        return {
          pokemon: female,
          compatiblePokemon: compatibleMales,
          compatibilityCount: compatibleMales.length,
          direction: 'female-to-male' as const,
        };
      })
      .sort((left, right) => right.compatibilityCount - left.compatibilityCount);
  }, [hatchablePokemon]);

  const maleRecommendations = useMemo(() => {
    const females = hatchablePokemon.filter((pokemon) => pokemon.gender === 'female');
    const males = hatchablePokemon.filter((pokemon) => pokemon.gender === 'male');

    return males
      .map((male) => {
        const compatibleFemales = females.filter(
          (female) => shareAnyEggGroup(male, female) && female.base_id !== male.base_id,
        );

        return {
          pokemon: male,
          compatiblePokemon: compatibleFemales,
          compatibilityCount: compatibleFemales.length,
          direction: 'male-to-female' as const,
        };
      })
      .sort((left, right) => right.compatibilityCount - left.compatibilityCount);
  }, [hatchablePokemon]);

  const stats = useMemo(() => {
    const total = hatchablePokemon.length;
    const maleCount = hatchablePokemon.filter((pokemon) => pokemon.gender === 'male').length;
    const femaleCount = hatchablePokemon.filter((pokemon) => pokemon.gender === 'female').length;
    const unknownCount = hatchablePokemon.filter((pokemon) => pokemon.gender === 'unknown').length;

    return { total, maleCount, femaleCount, unknownCount };
  }, [hatchablePokemon]);

  return { femaleRecommendations, maleRecommendations, stats };
};
