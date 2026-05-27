import { getSystemBreedingRecommendations } from './breedingCandidates';
import type { Pokemon } from '../types';

const makePokemon = (
  baseId: number,
  eggGroupId: number,
  familyKey: string,
  hatchStatus: '可生蛋' | '暂不可生蛋' = '可生蛋',
): Pokemon => ({
  base_id: baseId,
  display_name: `精灵${baseId}`,
  page_name: `精灵${baseId}`,
  avatar_url: `/pets/head/${baseId}.webp`,
  body_url: `/pets/body/${baseId}.webp`,
  class_name: '',
  type_name: '',
  hatch_status_text: hatchStatus,
  family_chain: `精灵${baseId}`,
  family_key: familyKey,
  member_count: 1,
  can_hatch_member_count: hatchStatus === '可生蛋' ? 1 : 0,
  egg_group_id: eggGroupId,
});

const recommendations = getSystemBreedingRecommendations([
  makePokemon(1, 1, 'family:one'),
  makePokemon(1, 2, 'family:one'),
  makePokemon(2, 1, 'family:two'),
  makePokemon(3, 2, 'family:three'),
  makePokemon(4, 3, 'family:four'),
  makePokemon(5, 1, 'family:blocked', '暂不可生蛋'),
]);

if (recommendations[0]?.pokemon.base_id !== 1 || recommendations[0].compatibilityCount !== 2) {
  throw new Error('system recommendations should rank multi-group pokemon by unique compatible families');
}

if (recommendations.some((recommendation) => recommendation.pokemon.base_id === 5)) {
  throw new Error('system recommendations should exclude non-hatchable pokemon');
}
