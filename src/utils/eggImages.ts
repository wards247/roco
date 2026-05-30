import eggImagesData from '../data/egg-images.json';
import { toPublicAssetUrl } from './publicAssets';

interface EggImage {
  petId: number;
  normal: string | null;
  shiny: string | null;
}

const eggMap = new Map<number, EggImage>();

for (const [petIdStr, entry] of Object.entries(eggImagesData.byPetId)) {
  const petId = Number(petIdStr);
  eggMap.set(petId, entry as EggImage);
}

export const getEggImage = (petId: number): EggImage | null =>
  eggMap.get(petId) ?? null;

export const hasEggImage = (petId: number): boolean => eggMap.has(petId);

export const getEggUrl = (petId: number): string | undefined => {
  const egg = eggMap.get(petId);

  return egg?.normal ? toPublicAssetUrl(egg.normal) : undefined;
};

export const getShinyEggUrl = (petId: number): string | undefined => {
  const egg = eggMap.get(petId);

  return egg?.shiny ? toPublicAssetUrl(egg.shiny) : undefined;
};
