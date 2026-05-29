import type { RocomPetCard, RocomPetIndex, RocomType } from '../types/rocom';
import { toPublicAssetUrl } from './publicAssets';

export const ROCOM_DATA_BASE = toPublicAssetUrl('/rocom/data');
export const ROCOM_FRIENDS_BASE = toPublicAssetUrl('/rocom/assets/webp/friends');

export const getRocomFriendImageUrl = (assetName: string) =>
  `${ROCOM_FRIENDS_BASE}/JL_${assetName}.webp`;

const getTypeLabel = (type: RocomType | null | undefined) => type?.localized.zh || '';

export const getRocomTypeName = (pet: RocomPetIndex) =>
  [getTypeLabel(pet.main_type), getTypeLabel(pet.sub_type)].filter(Boolean).join(', ');

export const getRocomDisplayName = (pet: RocomPetIndex) => pet.localized.zh.name || `精灵 #${pet.id}`;

export const getRocomTotalStats = (pet: RocomPetIndex) =>
  pet.base_hp + pet.base_phy_atk + pet.base_mag_atk + pet.base_phy_def + pet.base_mag_def + pet.base_spd;

export const hasRocomStats = (pet: RocomPetIndex) => getRocomTotalStats(pet) > 0;

export const getRocomDuplicateKey = (pet: RocomPetIndex) =>
  `${pet.name}|${getRocomDisplayName(pet)}`;

export const getCanonicalRocomPets = (pets: RocomPetIndex[]) => {
  const hasNonZeroStatsByKey = new Set(
    pets.filter(hasRocomStats).map(getRocomDuplicateKey),
  );

  return pets.filter((pet) => hasRocomStats(pet) || !hasNonZeroStatsByKey.has(getRocomDuplicateKey(pet)));
};

export const toRocomPetCard = (pet: RocomPetIndex): RocomPetCard => ({
  id: pet.id,
  name: getRocomDisplayName(pet),
  assetName: pet.name,
  typeName: getRocomTypeName(pet),
  eggGroupIds: pet.breeding_profile?.egg_groups ?? [],
  implemented: pet.implemented,
  avatarUrl: toPublicAssetUrl(`/pets/head/${pet.id}.webp`),
  bodyUrl: getRocomFriendImageUrl(pet.name),
  totalStats: getRocomTotalStats(pet),
});
