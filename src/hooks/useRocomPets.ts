import { useEffect, useMemo, useState } from 'react';
import type { RocomPetCard, RocomPetIndex } from '../types/rocom';
import { getCanonicalRocomPets, ROCOM_DATA_BASE } from '../utils/rocomPets';
import { toRocomPetCard } from '../utils/rocomPets';

export const useRocomPets = () => {
  const [pets, setPets] = useState<RocomPetIndex[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch(`${ROCOM_DATA_BASE}/Pets.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Pets.json 请求失败: ${response.status}`);
        }

        return response.json() as Promise<RocomPetIndex[]>;
      })
      .then((data) => {
        if (isMounted) {
          setPets(data);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const petCards = useMemo<RocomPetCard[]>(
    () => getCanonicalRocomPets(pets).map(toRocomPetCard),
    [pets],
  );

  const petById = useMemo(
    () => new Map(pets.map((pet) => [pet.id, pet])),
    [pets],
  );

  return {
    pets,
    petCards,
    petById,
    loading,
  };
};
