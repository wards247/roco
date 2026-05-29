import petGuideImagesData from '../data/pet-guide-images.json';
import { toPublicAssetUrl } from './publicAssets';

export interface PetGuideImage {
  guideId: number;
  displayName: string;
  sourceName: string;
  imageUrl: string;
  sourceUrl: string;
  articleTitle: string;
  imageIndex: number;
  relatedIds: number[];
}

const guideImages = petGuideImagesData.guides.map((guideImage) => ({
  ...guideImage,
  imageUrl: toPublicAssetUrl(guideImage.imageUrl),
})) satisfies PetGuideImage[];
const directGuideImageById = new Map<number, PetGuideImage>();
const relatedGuideImageById = new Map<number, PetGuideImage>();

guideImages.forEach((guideImage) => {
  directGuideImageById.set(guideImage.guideId, guideImage);
});

guideImages.forEach((guideImage) => {
  guideImage.relatedIds.forEach((relatedId) => {
    if (!relatedGuideImageById.has(relatedId)) {
      relatedGuideImageById.set(relatedId, guideImage);
    }
  });
});

export const getPetGuideImageById = (petId: number): PetGuideImage | null =>
  directGuideImageById.get(petId) || relatedGuideImageById.get(petId) || null;

export const hasPetGuideImage = (petId: number): boolean => getPetGuideImageById(petId) !== null;

export const getPetGuideImages = (): PetGuideImage[] => guideImages;
