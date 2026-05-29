import {
  buildBreedingPlan,
  getPlannerPokemonKey,
  sanitizeBreedingPlannerConfig,
} from './breedingPlanner';
import type { BreedingPlannerConfig } from './breedingPlanner';
import type { MyPokemon } from '../types';

const makeOwned = (
  baseId: number,
  gender: MyPokemon['gender'],
  eggGroupIds: number[],
  displayName = `精灵${baseId}`,
  canHatch = true,
): MyPokemon => ({
  base_id: baseId,
  egg_group_id: eggGroupIds[0] ?? 0,
  egg_group_ids: eggGroupIds,
  can_hatch: canHatch,
  gender,
  is_mine: true,
  display_name: displayName,
  avatar_url: `/pets/head/${baseId}.webp`,
});

const config: BreedingPlannerConfig = {
  nestCount: 4,
  entries: {
    '1:female': { enabled: true, count: 1 },
    '2:female': { enabled: true, count: 1 },
    '3:male': { enabled: true, count: 1 },
    '4:male': { enabled: true, count: 1 },
  },
};

const plan = buildBreedingPlan({
  pokemon: [
    makeOwned(1, 'female', [6], '雌一'),
    makeOwned(2, 'female', [7], '雌二'),
    makeOwned(3, 'male', [6], '雄一'),
    makeOwned(4, 'male', [6, 7], '雄二'),
    makeOwned(5, 'unknown', [6], '未知'),
    makeOwned(6, 'male', [6], '不可生蛋', false),
  ],
  config,
  random: () => 0.42,
});

if (plan.error) {
  throw new Error(`expected plan to generate, got ${plan.error}`);
}

if (plan.femaleInstances.length !== 2) {
  throw new Error('planner should expand enabled female counts');
}

if (plan.maleSlots.length !== 2) {
  throw new Error('planner should choose the required male slots');
}

if (plan.maleSlots.some((slot) => slot.baseId === 5 || slot.baseId === 6)) {
  throw new Error('planner should exclude unknown gender and non-hatchable pokemon');
}

if (!plan.placement || plan.placement.lines.length === 0) {
  throw new Error('planner should generate placement lines for covered females');
}

if (plan.placement.lines.some((line) => line.distance > 2)) {
  throw new Error('placement lines should only use Manhattan distance <= 2');
}

if (plan.placement.femaleInstances.length !== 2) {
  throw new Error('placement should expose covered female instances for UI rendering');
}

const femaleOne = plan.femalePairStats.find((stat) => stat.female.baseId === 1);
const femaleTwo = plan.femalePairStats.find((stat) => stat.female.baseId === 2);

if (!femaleOne || femaleOne.pairCount < 1 || !femaleTwo || femaleTwo.pairCount < 1) {
  throw new Error('female pair stats should count generated placement lines');
}

const lockedMale = plan.maleSlots.find((slot) => slot.lockedForIds.includes('2:female:0'));
if (!lockedMale || lockedMale.baseId !== 4) {
  throw new Error('planner should lock a male for females with only one compatible selected male');
}

const invalidNestPlan = buildBreedingPlan({
  pokemon: [makeOwned(1, 'female', [6]), makeOwned(2, 'male', [6])],
  config: {
    nestCount: 1,
    entries: {
      '1:female': { enabled: true, count: 1 },
      '2:male': { enabled: true, count: 1 },
    },
  },
  random: () => 0.5,
});

if (invalidNestPlan.error !== '雌性数量已占满窝位，请至少留 1 个雄性窝。') {
  throw new Error('planner should reject female count greater than or equal to nest count');
}

const noMalePlan = buildBreedingPlan({
  pokemon: [makeOwned(1, 'female', [6])],
  config: { nestCount: 2, entries: { '1:female': { enabled: true, count: 1 } } },
  random: () => 0.5,
});

if (noMalePlan.error !== '请至少启用 1 个雄性。') {
  throw new Error('planner should reject empty male stock');
}

const sanitized = sanitizeBreedingPlannerConfig({
  nestCount: 5.8,
  entries: {
    [getPlannerPokemonKey(1, 'female')]: { enabled: true, count: -4 },
    [getPlannerPokemonKey(2, 'male')]: { enabled: true, count: 999 },
    'invalid:key': { enabled: true, count: 1 },
  } as Record<string, { enabled: boolean; count: number }>,
});

if (
  sanitized.nestCount !== 5
  || sanitized.entries['1:female']?.count !== 0
  || sanitized.entries['2:male']?.count !== 10
) {
  throw new Error('planner config should clamp nest count and sanitize counts');
}

if ('invalid:key' in sanitized.entries) {
  throw new Error('planner config should drop invalid entry keys');
}

[
  { nestCount: 0, label: 'zero' },
  { nestCount: -2, label: 'negative' },
  { nestCount: Number.NaN, label: 'non-numeric' },
  { nestCount: 99, label: 'too large' },
].forEach(({ nestCount, label }) => {
  const result = sanitizeBreedingPlannerConfig({ nestCount, entries: {} });
  if (result.nestCount !== 10) {
    throw new Error(`planner config should default ${label} nest count to 10`);
  }
});

const sameBasePlan = buildBreedingPlan({
  pokemon: [makeOwned(10, 'female', [8], '同族雌'), makeOwned(10, 'male', [8], '同族雄')],
  config: {
    nestCount: 2,
    entries: {
      '10:female': { enabled: true, count: 1 },
      '10:male': { enabled: true, count: 1 },
    },
  },
  random: () => 0.5,
});

if (sameBasePlan.maleSlots.length !== 0 || sameBasePlan.uncoveredFemales.length !== 1) {
  throw new Error('planner should not pair male and female entries with the same base id');
}

const uncoveredPlan = buildBreedingPlan({
  pokemon: [
    makeOwned(20, 'female', [1], '可覆盖雌'),
    makeOwned(21, 'female', [2], '未覆盖雌'),
    makeOwned(22, 'male', [1], '覆盖雄'),
  ],
  config: {
    nestCount: 3,
    entries: {
      '20:female': { enabled: true, count: 1 },
      '21:female': { enabled: true, count: 1 },
      '22:male': { enabled: true, count: 1 },
    },
  },
  random: () => 0.5,
});

if (uncoveredPlan.uncoveredFemales.map((female) => female.baseId).join(',') !== '21') {
  throw new Error('planner should return uncovered females');
}

const uncoveredFemaleStat = uncoveredPlan.femalePairStats.find((stat) => stat.female.baseId === 21);
if (!uncoveredFemaleStat || uncoveredFemaleStat.pairCount !== 0) {
  throw new Error('female pair stats should keep uncovered females with zero pair count');
}

const normalSortedPlan = buildBreedingPlan({
  pokemon: [
    makeOwned(41, 'female', [2], '波二'),
    makeOwned(40, 'female', [2], '阿一'),
    makeOwned(42, 'female', [1], '常三'),
    makeOwned(43, 'male', [1], '覆盖雄'),
  ],
  config: {
    nestCount: 5,
    entries: {
      '41:female': { enabled: true, count: 1 },
      '40:female': { enabled: true, count: 1 },
      '42:female': { enabled: true, count: 1 },
      '43:male': { enabled: true, count: 1 },
    },
  },
  random: () => 0.5,
});

const normalSortedNames = normalSortedPlan.femalePairStats.map((stat) => stat.female.displayName).join(',');
if (normalSortedNames !== '常三,阿一,波二') {
  throw new Error('normal results should sort female pair stats by pair count desc then Chinese name');
}

const sortedErrorPlan = buildBreedingPlan({
  pokemon: [makeOwned(31, 'female', [6], '波二'), makeOwned(30, 'female', [6], '阿一')],
  config: {
    nestCount: 4,
    entries: {
      '31:female': { enabled: true, count: 1 },
      '30:female': { enabled: true, count: 1 },
    },
  },
  random: () => 0.5,
});

if (sortedErrorPlan.femalePairStats.map((stat) => stat.female.displayName).join(',') !== '阿一,波二') {
  throw new Error('error results should sort zero-count female pair stats by Chinese name');
}
