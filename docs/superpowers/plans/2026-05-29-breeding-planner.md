# Breeding Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persistent breeding planner on `/breeding` that lets users choose owned pets, configure counts and nest count, generate a compatible pairing plan, render a 7x7 Manhattan-distance pairing graph, and show female pairing counts.

**Architecture:** Keep algorithmic behavior in pure TypeScript utilities, persistence in a small external-store hook, and UI in one focused React component. `Breeding.tsx` continues to enrich owned Pokemon once and passes that data to both the existing compatibility ranking and the new planner.

**Tech Stack:** React 19, TypeScript, Vite, localStorage via `useSyncExternalStore`, SVG rendering, existing lightweight `*.spec.ts` assertion scripts.

---

## File Structure

- Create `src/utils/breedingPlanner.ts`: pure planner types, config sanitizing helpers, compatibility checks, recommendation generation, 7x7 placement solver, SVG-friendly line and statistic output.
- Create `src/utils/breedingPlanner.spec.ts`: lightweight assertions for validation, filtering, placement line distance, and female pairing counts.
- Create `src/hooks/useBreedingPlannerConfig.ts`: persistent config hook for `roco_breeding_planner_config`, with `nestCount` and per `base_id:gender` entry state.
- Create `src/components/BreedingPlanner.tsx`: planner UI, config controls, generate button, result summary, SVG grid, female count panel, male cover details.
- Create `src/components/BreedingPlanner.css`: scoped styles matching the existing white-card page style.
- Modify `src/pages/Breeding.tsx`: import and render `BreedingPlanner` above the existing recommendation layout.
- Modify `src/pages/Breeding.css`: add vertical spacing for the new top module if needed.

---

### Task 1: Planner Algorithm

**Files:**
- Create: `src/utils/breedingPlanner.ts`
- Test: `src/utils/breedingPlanner.spec.ts`

- [ ] **Step 1: Write failing planner assertions**

Create `src/utils/breedingPlanner.spec.ts`:

```ts
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

const femaleOne = plan.femalePairStats.find((stat) => stat.female.baseId === 1);
const femaleTwo = plan.femalePairStats.find((stat) => stat.female.baseId === 2);

if (!femaleOne || femaleOne.pairCount < 1 || !femaleTwo || femaleTwo.pairCount < 1) {
  throw new Error('female pair stats should count generated placement lines');
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
  nestCount: 99,
  entries: {
    [getPlannerPokemonKey(1, 'female')]: { enabled: true, count: -4 },
  },
});

if (sanitized.nestCount !== 10 || sanitized.entries['1:female']?.count !== 0) {
  throw new Error('planner config should clamp nest count and sanitize counts');
}
```

- [ ] **Step 2: Run build to verify the assertions fail**

Run:

```bash
npm run build
```

Expected: TypeScript fails because `./breedingPlanner` does not exist.

- [ ] **Step 3: Implement the planner utility**

Create `src/utils/breedingPlanner.ts`:

```ts
import type { Gender, MyPokemon } from '../types';

export type PlannerGender = Extract<Gender, 'male' | 'female'>;
export type PlannerPokemonKey = `${number}:${PlannerGender}`;

export interface BreedingPlannerEntryConfig {
  enabled: boolean;
  count: number;
}

export interface BreedingPlannerConfig {
  nestCount: number;
  entries: Record<PlannerPokemonKey, BreedingPlannerEntryConfig>;
}

export interface PlannerParticipant {
  key: PlannerPokemonKey;
  baseId: number;
  gender: PlannerGender;
  displayName: string;
  avatarUrl?: string;
  eggGroupIds: number[];
  count: number;
}

export interface PlannerInstance {
  id: string;
  participantKey: PlannerPokemonKey;
  baseId: number;
  displayName: string;
  avatarUrl?: string;
  eggGroupIds: number[];
  instanceIndex: number;
}

export interface PlannerMaleSlot extends PlannerInstance {
  locked: boolean;
  lockedForIds: string[];
}

export interface PlannerMaleCoverDetail {
  male: PlannerMaleSlot;
  coveredFemales: PlannerInstance[];
}

export interface PlannerCoord {
  x: number;
  y: number;
}

export interface PlannerLine {
  maleIndex: number;
  femaleIndex: number;
  distance: number;
  locked: boolean;
}

export interface PlannerPlacement {
  gridSize: number;
  maleCoords: PlannerCoord[];
  femaleCoords: PlannerCoord[];
  femaleInstances: PlannerInstance[];
  lines: PlannerLine[];
}

export interface PlannerFemalePairStat {
  female: PlannerInstance;
  pairCount: number;
}

export interface BreedingPlanResult {
  error?: string;
  femaleInstances: PlannerInstance[];
  maleSlots: PlannerMaleSlot[];
  uncoveredFemales: PlannerInstance[];
  maleCoverDetails: PlannerMaleCoverDetail[];
  placement?: PlannerPlacement;
  femalePairStats: PlannerFemalePairStat[];
}

interface BuildBreedingPlanInput {
  pokemon: MyPokemon[];
  config: BreedingPlannerConfig;
  random?: () => number;
}

interface PlacementFemale extends PlannerInstance {
  maleIndices: number[];
  constraints: Array<{ maleIndex: number; minDist: number; maxDist: number }>;
  coord?: PlannerCoord;
}

const GRID_SIZE = 7;
const DEFAULT_NEST_COUNT = 10;

export const getPlannerPokemonKey = (baseId: number, gender: PlannerGender): PlannerPokemonKey =>
  `${baseId}:${gender}`;

export const sanitizeBreedingPlannerConfig = (
  config: Partial<BreedingPlannerConfig> | null | undefined,
): BreedingPlannerConfig => {
  const rawNestCount = Number(config?.nestCount);
  const nestCount = Number.isFinite(rawNestCount)
    ? Math.max(1, Math.min(10, Math.floor(rawNestCount)))
    : DEFAULT_NEST_COUNT;

  const entries: BreedingPlannerConfig['entries'] = {};
  Object.entries(config?.entries ?? {}).forEach(([key, value]) => {
    if (!/^\d+:(male|female)$/.test(key)) {
      return;
    }

    const count = Number(value?.count);
    entries[key as PlannerPokemonKey] = {
      enabled: Boolean(value?.enabled),
      count: Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0,
    };
  });

  return { nestCount, entries };
};

export const getMyPokemonEggGroupIdsForPlanner = (pokemon: MyPokemon) =>
  pokemon.egg_group_ids && pokemon.egg_group_ids.length > 0
    ? pokemon.egg_group_ids
    : [pokemon.egg_group_id].filter((eggGroupId) => eggGroupId > 0);

const shareAnyEggGroup = (left: { eggGroupIds: number[] }, right: { eggGroupIds: number[] }) => {
  const rightGroups = new Set(right.eggGroupIds);
  return left.eggGroupIds.some((eggGroupId) => rightGroups.has(eggGroupId));
};

const areCompatible = (
  left: { baseId: number; eggGroupIds: number[] },
  right: { baseId: number; eggGroupIds: number[] },
) => left.baseId !== right.baseId && shareAnyEggGroup(left, right);

const buildParticipants = (pokemon: MyPokemon[], config: BreedingPlannerConfig): PlannerParticipant[] =>
  pokemon.flatMap((owned): PlannerParticipant[] => {
    if (owned.can_hatch === false || (owned.gender !== 'male' && owned.gender !== 'female')) {
      return [];
    }

    const key = getPlannerPokemonKey(owned.base_id, owned.gender);
    const entry = config.entries[key] ?? { enabled: true, count: 1 };
    if (!entry.enabled || entry.count <= 0) {
      return [];
    }

    const eggGroupIds = getMyPokemonEggGroupIdsForPlanner(owned);
    if (eggGroupIds.length === 0) {
      return [];
    }

    return [{
      key,
      baseId: owned.base_id,
      gender: owned.gender,
      displayName: owned.display_name || `精灵 #${owned.base_id}`,
      avatarUrl: owned.avatar_url,
      eggGroupIds,
      count: entry.count,
    }];
  });

const expandInstances = (participant: PlannerParticipant): PlannerInstance[] =>
  Array.from({ length: participant.count }, (_, index) => ({
    id: `${participant.key}:${index}`,
    participantKey: participant.key,
    baseId: participant.baseId,
    displayName: participant.count > 1 ? `${participant.displayName}${index + 1}` : participant.displayName,
    avatarUrl: participant.avatarUrl,
    eggGroupIds: participant.eggGroupIds,
    instanceIndex: index,
  }));

const calcUniquePairs = (femaleInstances: PlannerInstance[], maleSlots: PlannerMaleSlot[]) => {
  maleSlots.forEach((male) => {
    male.locked = false;
    male.lockedForIds = [];
  });

  femaleInstances.forEach((female) => {
    const compatibleMaleIndices = maleSlots.flatMap((male, index) =>
      areCompatible(male, female) ? [index] : [],
    );

    if (compatibleMaleIndices.length === 1) {
      const male = maleSlots[compatibleMaleIndices[0]];
      male.locked = true;
      male.lockedForIds.push(female.id);
    }
  });
};

const maxMatching = (females: PlannerInstance[], maleSlots: PlannerMaleSlot[]) => {
  const adjacency = maleSlots.map((male) =>
    females.flatMap((female, index) => (areCompatible(male, female) ? [index] : [])),
  );
  const matchedByFemale = Array(females.length).fill(-1);

  const dfs = (maleIndex: number, seen: boolean[]): boolean => {
    for (const femaleIndex of adjacency[maleIndex]) {
      if (seen[femaleIndex]) {
        continue;
      }
      seen[femaleIndex] = true;
      if (matchedByFemale[femaleIndex] === -1 || dfs(matchedByFemale[femaleIndex], seen)) {
        matchedByFemale[femaleIndex] = maleIndex;
        return true;
      }
    }
    return false;
  };

  let result = 0;
  maleSlots.forEach((_, maleIndex) => {
    if (dfs(maleIndex, Array(females.length).fill(false))) {
      result += 1;
    }
  });

  return result;
};

const ensureHallCondition = (females: PlannerInstance[], maleSlots: PlannerMaleSlot[]) => {
  const males = [...maleSlots];
  while (males.length > 0) {
    if (maxMatching(females, males) === males.length) {
      break;
    }

    let worstIndex = -1;
    let worstCover = Infinity;
    males.forEach((male, index) => {
      if (male.locked) {
        return;
      }
      const cover = females.filter((female) => areCompatible(male, female)).length;
      if (cover < worstCover) {
        worstCover = cover;
        worstIndex = index;
      }
    });

    males.splice(worstIndex === -1 ? males.length - 1 : worstIndex, 1);
  }
  return males;
};

const getDistance = (left: PlannerCoord, right: PlannerCoord) =>
  Math.abs(left.x - right.x) + Math.abs(left.y - right.y);

const compactPlacement = (placement: Omit<PlannerPlacement, 'gridSize' | 'lines'>) => {
  const all = [...placement.maleCoords, ...placement.femaleCoords];
  const minX = Math.min(...all.map((coord) => coord.x));
  const minY = Math.min(...all.map((coord) => coord.y));
  return {
    maleCoords: placement.maleCoords.map((coord) => ({ x: coord.x - minX, y: coord.y - minY })),
    femaleCoords: placement.femaleCoords.map((coord) => ({ x: coord.x - minX, y: coord.y - minY })),
  };
};

const centerPlacement = (placement: Omit<PlannerPlacement, 'gridSize' | 'lines'>) => {
  const all = [...placement.maleCoords, ...placement.femaleCoords];
  const minX = Math.min(...all.map((coord) => coord.x));
  const maxX = Math.max(...all.map((coord) => coord.x));
  const minY = Math.min(...all.map((coord) => coord.y));
  const maxY = Math.max(...all.map((coord) => coord.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const offsetX = Math.floor((GRID_SIZE - width) / 2) - minX;
  const offsetY = Math.floor((GRID_SIZE - height) / 2) - minY;

  return {
    maleCoords: placement.maleCoords.map((coord) => ({ x: coord.x + offsetX, y: coord.y + offsetY })),
    femaleCoords: placement.femaleCoords.map((coord) => ({ x: coord.x + offsetX, y: coord.y + offsetY })),
  };
};

const createPlacementLines = (
  maleSlots: PlannerMaleSlot[],
  femaleInstances: PlannerInstance[],
  maleCoords: PlannerCoord[],
  femaleCoords: PlannerCoord[],
): PlannerLine[] =>
  maleCoords.flatMap((maleCoord, maleIndex) =>
    femaleCoords.flatMap((femaleCoord, femaleIndex) => {
      const distance = getDistance(maleCoord, femaleCoord);
      if (distance > 2 || !areCompatible(maleSlots[maleIndex], femaleInstances[femaleIndex])) {
        return [];
      }
      return [{
        maleIndex,
        femaleIndex,
        distance,
        locked: maleSlots[maleIndex].lockedForIds.includes(femaleInstances[femaleIndex].id),
      }];
    }),
  );

const solvePlacement = (
  femaleInstances: PlannerInstance[],
  maleSlots: PlannerMaleSlot[],
  random: () => number,
): PlannerPlacement | undefined => {
  const maleCompatCount = maleSlots.map((male) =>
    femaleInstances.filter((female) => areCompatible(male, female)).length,
  );
  const maleUniqueCount = maleSlots.map((male) =>
    femaleInstances.filter((female) =>
      areCompatible(male, female) && maleSlots.filter((candidate) => areCompatible(candidate, female)).length === 1,
    ).length,
  );
  const females: PlacementFemale[] = femaleInstances.map((female) => {
    const maleIndices = maleSlots.flatMap((male, index) => (areCompatible(male, female) ? [index] : []));
    const constraints = maleIndices.map((maleIndex) => {
      const uniqueDependency = maleIndices.length === 1;
      return {
        maleIndex,
        minDist: maleUniqueCount[maleIndex] > 0 && !uniqueDependency ? 2 : 1,
        maxDist: uniqueDependency || maleCompatCount[maleIndex] >= 4 ? 2 : Math.min(maleIndices.length, 2),
      };
    });
    return { ...female, maleIndices, constraints };
  });

  let best: Omit<PlannerPlacement, 'gridSize' | 'lines'> | undefined;
  let bestArea = Infinity;

  const canPlaceAllFemales = (
    sorted: PlacementFemale[],
    start: number,
    occupied: Set<number>,
    maleCoords: PlannerCoord[],
  ): boolean => {
    if (start >= sorted.length) {
      return true;
    }

    const female = sorted[start];
    const candidates: PlannerCoord[] = [];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        const key = y * GRID_SIZE + x;
        if (occupied.has(key)) {
          continue;
        }
        if (female.constraints.every((constraint) => {
          const distance = getDistance({ x, y }, maleCoords[constraint.maleIndex]);
          return distance >= constraint.minDist && distance <= constraint.maxDist;
        })) {
          candidates.push({ x, y });
        }
      }
    }

    candidates.sort((left, right) => {
      const leftDistance = female.constraints.reduce(
        (sum, constraint) => sum + getDistance(left, maleCoords[constraint.maleIndex]),
        0,
      );
      const rightDistance = female.constraints.reduce(
        (sum, constraint) => sum + getDistance(right, maleCoords[constraint.maleIndex]),
        0,
      );
      return leftDistance - rightDistance;
    });

    for (const coord of candidates) {
      const key = coord.y * GRID_SIZE + coord.x;
      occupied.add(key);
      female.coord = coord;
      if (canPlaceAllFemales(sorted, start + 1, occupied, maleCoords)) {
        return true;
      }
      occupied.delete(key);
      female.coord = undefined;
    }
    return false;
  };

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const occupied = new Set<number>();
    const maleCoords = maleSlots.map(() => {
      let coord: PlannerCoord;
      do {
        coord = {
          x: Math.floor(random() * GRID_SIZE),
          y: Math.floor(random() * GRID_SIZE),
        };
      } while (occupied.has(coord.y * GRID_SIZE + coord.x));
      occupied.add(coord.y * GRID_SIZE + coord.x);
      return coord;
    });

    const sorted = females
      .map((female) => ({ ...female, coord: undefined }))
      .sort((left, right) => left.maleIndices.length - right.maleIndices.length);

    if (!canPlaceAllFemales(sorted, 0, new Set(occupied), maleCoords)) {
      continue;
    }

    const femaleCoords = femaleInstances.map((female) => {
      const placed = sorted.find((entry) => entry.id === female.id);
      return placed?.coord ?? { x: 0, y: 0 };
    });
    const compacted = compactPlacement({ maleCoords, femaleCoords });
    const all = [...compacted.maleCoords, ...compacted.femaleCoords];
    const area =
      (Math.max(...all.map((coord) => coord.x)) - Math.min(...all.map((coord) => coord.x)) + 1) *
      (Math.max(...all.map((coord) => coord.y)) - Math.min(...all.map((coord) => coord.y)) + 1);

    if (area < bestArea) {
      bestArea = area;
      best = compacted;
    }
  }

  if (!best) {
    return undefined;
  }

  const centered = centerPlacement(best);
  return {
    gridSize: GRID_SIZE,
    ...centered,
    femaleInstances,
    lines: createPlacementLines(maleSlots, femaleInstances, centered.maleCoords, centered.femaleCoords),
  };
};

export const buildBreedingPlan = ({
  pokemon,
  config,
  random = Math.random,
}: BuildBreedingPlanInput): BreedingPlanResult => {
  const sanitizedConfig = sanitizeBreedingPlannerConfig(config);
  const participants = buildParticipants(pokemon, sanitizedConfig);
  const femaleInstances = participants
    .filter((participant) => participant.gender === 'female')
    .flatMap(expandInstances);
  const maleParticipants = participants.filter((participant) => participant.gender === 'male');
  const requiredMales = sanitizedConfig.nestCount - femaleInstances.length;

  const emptyResult = (error: string): BreedingPlanResult => ({
    error,
    femaleInstances,
    maleSlots: [],
    uncoveredFemales: femaleInstances,
    maleCoverDetails: [],
    femalePairStats: femaleInstances.map((female) => ({ female, pairCount: 0 })),
  });

  if (requiredMales <= 0) {
    return emptyResult('雌性数量已占满窝位，请至少留 1 个雄性窝。');
  }

  const maleStock = maleParticipants.flatMap(expandInstances);
  if (maleStock.length === 0) {
    return emptyResult('请至少启用 1 个雄性。');
  }

  const selectedMales: PlannerMaleSlot[] = [];
  const remainingStock = [...maleStock];
  const uncoveredFemaleIds = new Set(femaleInstances.map((female) => female.id));

  while (selectedMales.length < requiredMales && remainingStock.length > 0) {
    let bestIndex = -1;
    let bestNewCoverage = -1;
    let bestTotalCoverage = -1;

    remainingStock.forEach((male, index) => {
      const coveredFemales = femaleInstances.filter((female) => areCompatible(male, female));
      const newCoverage = coveredFemales.filter((female) => uncoveredFemaleIds.has(female.id)).length;
      if (newCoverage > bestNewCoverage || (newCoverage === bestNewCoverage && coveredFemales.length > bestTotalCoverage)) {
        bestIndex = index;
        bestNewCoverage = newCoverage;
        bestTotalCoverage = coveredFemales.length;
      }
    });

    if (bestIndex === -1 || bestTotalCoverage <= 0) {
      break;
    }

    const [male] = remainingStock.splice(bestIndex, 1);
    selectedMales.push({ ...male, locked: false, lockedForIds: [] });
    femaleInstances.forEach((female) => {
      if (areCompatible(male, female)) {
        uncoveredFemaleIds.delete(female.id);
      }
    });
  }

  const maleSlots = ensureHallCondition(femaleInstances, selectedMales);
  calcUniquePairs(femaleInstances, maleSlots);

  const coveredFemaleIds = new Set<string>();
  const maleCoverDetails = maleSlots.map((male) => {
    const coveredFemales = femaleInstances.filter((female) => areCompatible(male, female));
    coveredFemales.forEach((female) => coveredFemaleIds.add(female.id));
    return { male, coveredFemales };
  });
  const uncoveredFemales = femaleInstances.filter((female) => !coveredFemaleIds.has(female.id));
  const coveredFemales = femaleInstances.filter((female) => coveredFemaleIds.has(female.id));
  const placement = coveredFemales.length > 0 ? solvePlacement(coveredFemales, maleSlots, random) : undefined;
  const femalePairStats = femaleInstances
    .map((female) => {
      const placementFemaleIndex = coveredFemales.findIndex((candidate) => candidate.id === female.id);
      const pairCount = placementFemaleIndex === -1
        ? 0
        : placement?.lines.filter((line) => line.femaleIndex === placementFemaleIndex).length ?? 0;
      return { female, pairCount };
    })
    .sort((left, right) => right.pairCount - left.pairCount || left.female.displayName.localeCompare(right.female.displayName, 'zh-Hans-CN'));

  return {
    femaleInstances,
    maleSlots,
    uncoveredFemales,
    maleCoverDetails,
    placement,
    femalePairStats,
  };
};
```

- [ ] **Step 4: Run build to verify planner assertions pass**

Run:

```bash
npm run build
```

Expected: build may still fail on unrelated UI import absence if later tasks are incomplete, but after Task 1 alone it should pass and include `breedingPlanner.spec.ts`.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/utils/breedingPlanner.ts src/utils/breedingPlanner.spec.ts
git commit -m "feat: add breeding planner algorithm"
```

---

### Task 2: Persistent Planner Config Hook

**Files:**
- Create: `src/hooks/useBreedingPlannerConfig.ts`
- Modify: `src/utils/breedingPlanner.ts`
- Test: `src/utils/breedingPlanner.spec.ts`

- [ ] **Step 1: Add failing config merge assertions**

Append to `src/utils/breedingPlanner.spec.ts`:

```ts
import { mergeBreedingPlannerConfigWithPokemon } from './breedingPlanner';

const merged = mergeBreedingPlannerConfigWithPokemon(
  [
    makeOwned(10, 'female', [6], '新增雌'),
    makeOwned(11, 'male', [6], '新增雄'),
    makeOwned(12, 'unknown', [6], '未知'),
  ],
  { nestCount: 3, entries: { '10:female': { enabled: false, count: 2 } } },
);

if (merged.entries['10:female']?.enabled !== false || merged.entries['10:female']?.count !== 2) {
  throw new Error('config merge should preserve existing planner entry values');
}

if (merged.entries['11:male']?.enabled !== true || merged.entries['11:male']?.count !== 1) {
  throw new Error('config merge should default new owned male entries to enabled count 1');
}

if ('12:unknown' in merged.entries) {
  throw new Error('config merge should not create entries for unknown gender');
}
```

- [ ] **Step 2: Run build to verify the assertion fails**

Run:

```bash
npm run build
```

Expected: TypeScript fails because `mergeBreedingPlannerConfigWithPokemon` is not exported.

- [ ] **Step 3: Implement merge helper**

Add this export to `src/utils/breedingPlanner.ts` after `sanitizeBreedingPlannerConfig`:

```ts
export const mergeBreedingPlannerConfigWithPokemon = (
  pokemon: MyPokemon[],
  config: BreedingPlannerConfig,
): BreedingPlannerConfig => {
  const sanitized = sanitizeBreedingPlannerConfig(config);
  const entries = { ...sanitized.entries };

  pokemon.forEach((owned) => {
    if (owned.can_hatch === false || (owned.gender !== 'male' && owned.gender !== 'female')) {
      return;
    }

    const key = getPlannerPokemonKey(owned.base_id, owned.gender);
    if (!entries[key]) {
      entries[key] = { enabled: true, count: 1 };
    }
  });

  return { nestCount: sanitized.nestCount, entries };
};
```

- [ ] **Step 4: Run build to verify merge assertions pass**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 5: Create persistent hook**

Create `src/hooks/useBreedingPlannerConfig.ts`:

```ts
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { MyPokemon } from '../types';
import {
  mergeBreedingPlannerConfigWithPokemon,
  sanitizeBreedingPlannerConfig,
  type BreedingPlannerConfig,
  type PlannerGender,
} from '../utils/breedingPlanner';

const STORAGE_KEY = 'roco_breeding_planner_config';
const STORAGE_EVENT = 'roco_breeding_planner_config_changed';

const readStoredConfig = (): BreedingPlannerConfig => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return sanitizeBreedingPlannerConfig(undefined);
  }

  try {
    return sanitizeBreedingPlannerConfig(JSON.parse(stored));
  } catch {
    return sanitizeBreedingPlannerConfig(undefined);
  }
};

const writeStoredConfig = (config: BreedingPlannerConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeBreedingPlannerConfig(config)));
  window.dispatchEvent(new Event(STORAGE_EVENT));
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

export const useBreedingPlannerConfig = (pokemon: MyPokemon[]) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () =>
    JSON.stringify(sanitizeBreedingPlannerConfig(undefined)),
  );

  const config = useMemo(
    () => mergeBreedingPlannerConfigWithPokemon(pokemon, JSON.parse(snapshot) as BreedingPlannerConfig),
    [pokemon, snapshot],
  );

  const updateNestCount = useCallback((nestCount: number) => {
    const next = { ...readStoredConfig(), nestCount };
    writeStoredConfig(next);
  }, []);

  const updateEntry = useCallback((baseId: number, gender: PlannerGender, patch: Partial<{ enabled: boolean; count: number }>) => {
    const current = readStoredConfig();
    const key = `${baseId}:${gender}` as const;
    const previous = current.entries[key] ?? { enabled: true, count: 1 };
    writeStoredConfig({
      ...current,
      entries: {
        ...current.entries,
        [key]: {
          enabled: patch.enabled ?? previous.enabled,
          count: patch.count ?? previous.count,
        },
      },
    });
  }, []);

  const setAllEnabled = useCallback((enabled: boolean, visiblePokemon: MyPokemon[]) => {
    const current = readStoredConfig();
    const entries = { ...current.entries };
    visiblePokemon.forEach((owned) => {
      if (owned.gender !== 'male' && owned.gender !== 'female') {
        return;
      }
      const key = `${owned.base_id}:${owned.gender}` as const;
      entries[key] = { ...(entries[key] ?? { count: 1, enabled }), enabled };
    });
    writeStoredConfig({ ...current, entries });
  }, []);

  return {
    config,
    updateNestCount,
    updateEntry,
    setAllEnabled,
  };
};
```

- [ ] **Step 6: Run build to verify hook compiles**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add src/hooks/useBreedingPlannerConfig.ts src/utils/breedingPlanner.ts src/utils/breedingPlanner.spec.ts
git commit -m "feat: persist breeding planner config"
```

---

### Task 3: Planner UI Component

**Files:**
- Create: `src/components/BreedingPlanner.tsx`
- Create: `src/components/BreedingPlanner.css`

- [ ] **Step 1: Create component file**

Create `src/components/BreedingPlanner.tsx`:

```tsx
import { useMemo, useState } from 'react';
import type { MyPokemon } from '../types';
import { useBreedingPlannerConfig } from '../hooks/useBreedingPlannerConfig';
import {
  buildBreedingPlan,
  getMyPokemonEggGroupIdsForPlanner,
  getPlannerPokemonKey,
  type BreedingPlanResult,
  type PlannerGender,
  type PlannerInstance,
} from '../utils/breedingPlanner';
import './BreedingPlanner.css';

interface Props {
  pokemon: MyPokemon[];
}

const getPokemonAvatar = (pokemon: MyPokemon) =>
  pokemon.avatar_url?.startsWith('/') ? pokemon.avatar_url : `/pets/head/${pokemon.base_id}.webp`;

const getPokemonName = (pokemon: MyPokemon) => pokemon.display_name || `精灵 #${pokemon.base_id}`;

const formatInstanceName = (female: PlannerInstance) =>
  female.instanceIndex > 0 ? `${female.displayName}` : female.displayName;

const BreedingPlanner = ({ pokemon }: Props) => {
  const plannerPokemon = useMemo(
    () => pokemon.filter((owned) => owned.can_hatch !== false && (owned.gender === 'male' || owned.gender === 'female')),
    [pokemon],
  );
  const { config, updateNestCount, updateEntry, setAllEnabled } = useBreedingPlannerConfig(plannerPokemon);
  const [result, setResult] = useState<BreedingPlanResult | null>(null);

  const groupedPokemon = useMemo(
    () => ({
      female: plannerPokemon.filter((owned) => owned.gender === 'female'),
      male: plannerPokemon.filter((owned) => owned.gender === 'male'),
    }),
    [plannerPokemon],
  );

  const enabledFemaleCount = groupedPokemon.female.reduce((sum, owned) => {
    const entry = config.entries[getPlannerPokemonKey(owned.base_id, 'female')];
    return sum + (entry?.enabled ? entry.count : 0);
  }, 0);
  const enabledMaleCount = groupedPokemon.male.reduce((sum, owned) => {
    const entry = config.entries[getPlannerPokemonKey(owned.base_id, 'male')];
    return sum + (entry?.enabled ? entry.count : 0);
  }, 0);

  const handleGenerate = () => {
    setResult(buildBreedingPlan({ pokemon: plannerPokemon, config }));
  };

  const renderPokemonRows = (gender: PlannerGender) => {
    const rows = groupedPokemon[gender];
    if (rows.length === 0) {
      return <div className="breeding-planner__empty">暂无{gender === 'female' ? '雌性' : '雄性'}可生蛋精灵。</div>;
    }

    return rows.map((owned) => {
      const key = getPlannerPokemonKey(owned.base_id, gender);
      const entry = config.entries[key] ?? { enabled: true, count: 1 };
      return (
        <label className="breeding-planner__row" key={key}>
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={(event) => updateEntry(owned.base_id, gender, { enabled: event.target.checked })}
          />
          <img src={getPokemonAvatar(owned)} alt={getPokemonName(owned)} />
          <span className="breeding-planner__identity">
            <span className="breeding-planner__name">{getPokemonName(owned)}</span>
            <span className="breeding-planner__groups">
              蛋组 {getMyPokemonEggGroupIdsForPlanner(owned).join(' / ')}
            </span>
          </span>
          <input
            className="breeding-planner__count"
            type="number"
            min={0}
            max={10}
            value={entry.count}
            onChange={(event) => updateEntry(owned.base_id, gender, { count: Number(event.target.value) })}
            aria-label={`${getPokemonName(owned)}数量`}
          />
        </label>
      );
    });
  };

  return (
    <section className="breeding-planner">
      <div className="breeding-planner__header">
        <div>
          <h3 className="section-title">配窝助手</h3>
          <p className="section-desc">选择参与生蛋的拥有精灵，生成推荐配对和 7x7 位置图。</p>
        </div>
        <div className="breeding-planner__nest">
          <label htmlFor="breeding-planner-nest-count">窝位数</label>
          <input
            id="breeding-planner-nest-count"
            type="number"
            min={1}
            max={10}
            value={config.nestCount}
            onChange={(event) => updateNestCount(Number(event.target.value))}
          />
        </div>
      </div>

      <div className="breeding-planner__toolbar">
        <span>已启用：雌性 {enabledFemaleCount} / 雄性 {enabledMaleCount}</span>
        <button type="button" onClick={() => setAllEnabled(true, plannerPokemon)}>全选</button>
        <button type="button" onClick={() => setAllEnabled(false, plannerPokemon)}>清空</button>
        <button type="button" className="breeding-planner__primary" onClick={handleGenerate}>生成方案</button>
      </div>

      <div className="breeding-planner__selectors">
        <div className="breeding-planner__group">
          <h4>雌性</h4>
          {renderPokemonRows('female')}
        </div>
        <div className="breeding-planner__group">
          <h4>雄性</h4>
          {renderPokemonRows('male')}
        </div>
      </div>

      {result && (
        <div className="breeding-planner__result">
          {result.error ? (
            <div className="breeding-planner__warning">{result.error}</div>
          ) : (
            <>
              {result.uncoveredFemales.length > 0 && (
                <div className="breeding-planner__warning">
                  未覆盖雌性：{result.uncoveredFemales.map((female) => female.displayName).join('、')}
                </div>
              )}
              <div className="breeding-planner__visuals">
                <div className="breeding-planner__svg-wrap">
                  {result.placement ? (
                    <svg className="breeding-planner__svg" viewBox="0 0 420 420" role="img" aria-label="配对位置图">
                      {Array.from({ length: result.placement.gridSize + 1 }, (_, index) => (
                        <g key={`grid-${index}`}>
                          <line x1={0} y1={index * 60} x2={420} y2={index * 60} />
                          <line x1={index * 60} y1={0} x2={index * 60} y2={420} />
                        </g>
                      ))}
                      {result.placement.lines.map((line) => {
                        const male = result.placement?.maleCoords[line.maleIndex];
                        const female = result.placement?.femaleCoords[line.femaleIndex];
                        if (!male || !female) {
                          return null;
                        }
                        return (
                          <line
                            key={`line-${line.maleIndex}-${line.femaleIndex}`}
                            className={line.locked ? 'breeding-planner__line is-locked' : 'breeding-planner__line'}
                            x1={male.x * 60 + 30}
                            y1={male.y * 60 + 30}
                            x2={female.x * 60 + 30}
                            y2={female.y * 60 + 30}
                          />
                        );
                      })}
                      {result.placement.femaleCoords.map((coord, index) => {
                        const female = result.placement?.femaleInstances[index];
                        return (
                          <g key={`female-${female?.id ?? index}`}>
                            <rect className="breeding-planner__cell is-female" x={coord.x * 60 + 3} y={coord.y * 60 + 3} width={54} height={54} rx={6} />
                            <text x={coord.x * 60 + 30} y={coord.y * 60 + 26}>♀</text>
                            <text x={coord.x * 60 + 30} y={coord.y * 60 + 42}>{female?.displayName.slice(0, 4)}</text>
                          </g>
                        );
                      })}
                      {result.placement.maleCoords.map((coord, index) => {
                        const male = result.maleSlots[index];
                        return (
                          <g key={`male-${index}`}>
                            <rect className="breeding-planner__cell is-male" x={coord.x * 60 + 3} y={coord.y * 60 + 3} width={54} height={54} rx={6} />
                            <text x={coord.x * 60 + 30} y={coord.y * 60 + 26}>♂</text>
                            <text x={coord.x * 60 + 30} y={coord.y * 60 + 42}>{male?.displayName.slice(0, 4)}</text>
                          </g>
                        );
                      })}
                    </svg>
                  ) : (
                    <div className="breeding-planner__empty">没有可生成的位置图。</div>
                  )}
                </div>
                <div className="breeding-planner__stats">
                  <h4>雌性配对次数</h4>
                  {result.femalePairStats.map((stat) => (
                    <div className={stat.pairCount === 0 ? 'breeding-planner__stat is-zero' : 'breeding-planner__stat'} key={stat.female.id}>
                      <span>{formatInstanceName(stat.female)}</span>
                      <strong>{stat.pairCount}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="breeding-planner__details">
                {result.maleCoverDetails.map((detail) => (
                  <article key={detail.male.id}>
                    <strong>♂ {detail.male.displayName}</strong>
                    <span>可覆盖：{detail.coveredFemales.map((female) => female.displayName).join('、') || '无'}</span>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default BreedingPlanner;
```

- [ ] **Step 2: Create component CSS**

Create `src/components/BreedingPlanner.css`:

```css
.breeding-planner {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.breeding-planner__header,
.breeding-planner__toolbar,
.breeding-planner__visuals {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  justify-content: space-between;
}

.breeding-planner__nest {
  display: grid;
  gap: 0.35rem;
  color: #555;
  font-size: 0.9rem;
}

.breeding-planner__nest input,
.breeding-planner__count {
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
}

.breeding-planner__toolbar {
  align-items: center;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.breeding-planner__toolbar button {
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  background: #fff;
  color: #333;
  cursor: pointer;
  padding: 0.5rem 0.85rem;
}

.breeding-planner__primary {
  background: #2f6f5e !important;
  border-color: #2f6f5e !important;
  color: #fff !important;
}

.breeding-planner__selectors {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.breeding-planner__group {
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 1rem;
}

.breeding-planner__group h4,
.breeding-planner__stats h4 {
  margin: 0 0 0.75rem;
  color: #333;
}

.breeding-planner__row {
  display: grid;
  grid-template-columns: auto 40px minmax(0, 1fr) 72px;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem 0;
  border-top: 1px solid #f0f0f0;
}

.breeding-planner__row:first-of-type {
  border-top: 0;
}

.breeding-planner__row img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.breeding-planner__identity {
  min-width: 0;
  display: grid;
  gap: 0.15rem;
}

.breeding-planner__name {
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breeding-planner__groups {
  color: #777;
  font-size: 0.8rem;
}

.breeding-planner__result {
  margin-top: 1rem;
}

.breeding-planner__warning {
  background: #fff3f0;
  border: 1px solid #ffd2ca;
  border-radius: 8px;
  color: #a33b2e;
  margin-bottom: 1rem;
  padding: 0.75rem;
}

.breeding-planner__svg-wrap {
  flex: 1 1 520px;
  min-width: 0;
}

.breeding-planner__svg {
  width: 100%;
  max-width: 520px;
  height: auto;
}

.breeding-planner__svg line {
  stroke: #d9c5a7;
  stroke-width: 1;
}

.breeding-planner__line {
  stroke: #55a36c !important;
  stroke-width: 3 !important;
  opacity: 0.75;
}

.breeding-planner__line.is-locked {
  stroke: #c95353 !important;
}

.breeding-planner__cell {
  stroke-width: 2;
}

.breeding-planner__cell.is-female {
  fill: #f7d4d9;
  stroke: #d8949f;
}

.breeding-planner__cell.is-male {
  fill: #d8e8f8;
  stroke: #7da3c9;
}

.breeding-planner__svg text {
  dominant-baseline: middle;
  fill: #333;
  font-size: 10px;
  pointer-events: none;
  text-anchor: middle;
}

.breeding-planner__stats {
  flex: 0 0 260px;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 1rem;
}

.breeding-planner__stat {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  border-top: 1px solid #f0f0f0;
}

.breeding-planner__stat.is-zero {
  color: #a33b2e;
}

.breeding-planner__details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.breeding-planner__details article {
  border: 1px solid #ececec;
  border-radius: 10px;
  display: grid;
  gap: 0.35rem;
  padding: 0.75rem;
}

.breeding-planner__details span,
.breeding-planner__empty {
  color: #777;
  font-size: 0.9rem;
}

@media (max-width: 820px) {
  .breeding-planner__header,
  .breeding-planner__visuals {
    display: grid;
  }

  .breeding-planner__selectors {
    grid-template-columns: 1fr;
  }

  .breeding-planner__stats {
    flex-basis: auto;
  }
}
```

- [ ] **Step 3: Run build to catch type and JSX issues**

Run:

```bash
npm run build
```

Expected: build passes after applying Step 2 if needed.

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add src/components/BreedingPlanner.tsx src/components/BreedingPlanner.css src/utils/breedingPlanner.ts
git commit -m "feat: add breeding planner component"
```

---

### Task 4: Page Integration

**Files:**
- Modify: `src/pages/Breeding.tsx`
- Modify: `src/pages/Breeding.css`

- [ ] **Step 1: Integrate component into page**

Modify `src/pages/Breeding.tsx` imports:

```tsx
import BreedingPlanner from '../components/BreedingPlanner';
```

Render it after the stats block and before `<div className="breeding-layout">`:

```tsx
<BreedingPlanner pokemon={enrichedMyPokemon} />
```

- [ ] **Step 2: Keep page spacing stable**

If the top module visually touches the ranking layout, add to `src/pages/Breeding.css`:

```css
.breeding > .breeding-planner {
  margin-top: 1rem;
}
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add src/pages/Breeding.tsx src/pages/Breeding.css
git commit -m "feat: show breeding planner on breeding page"
```

---

### Task 5: Browser Verification

**Files:**
- No source edits expected unless verification finds a defect.

- [ ] **Step 1: Start or reuse dev server**

Run:

```bash
npm run dev
```

Expected: Vite serves the app, usually at `http://localhost:5173`.

- [ ] **Step 2: Seed localStorage for the browser check**

Using `agent-browser eval` against `http://localhost:5173/breeding`, set:

```js
localStorage.setItem('roco_my_pokemon', JSON.stringify([
  { base_id: 1, egg_group_id: 6, egg_group_ids: [6], gender: 'female', is_mine: true, can_hatch: true, display_name: '雌一', avatar_url: '/pets/head/1.webp' },
  { base_id: 2, egg_group_id: 7, egg_group_ids: [7], gender: 'female', is_mine: true, can_hatch: true, display_name: '雌二', avatar_url: '/pets/head/2.webp' },
  { base_id: 3, egg_group_id: 6, egg_group_ids: [6], gender: 'male', is_mine: true, can_hatch: true, display_name: '雄一', avatar_url: '/pets/head/3.webp' },
  { base_id: 4, egg_group_id: 7, egg_group_ids: [7], gender: 'male', is_mine: true, can_hatch: true, display_name: '雄二', avatar_url: '/pets/head/4.webp' }
]));
localStorage.removeItem('roco_breeding_planner_config');
location.reload();
```

- [ ] **Step 3: Verify DOM state**

Using `agent-browser eval`, check:

```js
({
  title: document.querySelector('.breeding-planner .section-title')?.textContent,
  femaleRows: document.querySelectorAll('.breeding-planner__group:first-of-type .breeding-planner__row').length,
  maleRows: document.querySelectorAll('.breeding-planner__group:last-of-type .breeding-planner__row').length,
  beforeRanking: !!document.querySelector('.breeding-planner + .breeding-layout')
})
```

Expected:

```js
{
  title: '配窝助手',
  femaleRows: 2,
  maleRows: 2,
  beforeRanking: true
}
```

- [ ] **Step 4: Generate and verify result**

Using `agent-browser eval`, run:

```js
document.querySelector('.breeding-planner__primary').click();
({
  hasSvg: !!document.querySelector('.breeding-planner__svg'),
  statRows: document.querySelectorAll('.breeding-planner__stat').length,
  savedConfig: JSON.parse(localStorage.getItem('roco_breeding_planner_config') || '{}').nestCount
})
```

Expected:

```js
{
  hasSvg: true,
  statRows: 2,
  savedConfig: 10
}
```

- [ ] **Step 5: Final verification**

Run:

```bash
npm run build
npm run lint
```

Expected: both commands pass.

- [ ] **Step 6: Commit verification fixes if any**

If browser verification required code changes, commit them:

```bash
git add src
git commit -m "fix: polish breeding planner verification issues"
```

If no changes were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers persistent planner config, no shiny split, configurable `1-10` nest count, owned Pokemon selection, generated plan, 7x7 SVG graph, Manhattan-distance `<= 2` lines, female pairing count display, original ranking preservation, build/lint/browser verification.
- Placeholder scan: The plan contains concrete file paths, commands, expected results, and code snippets. No `TBD` or incomplete implementation markers are present.
- Type consistency: `BreedingPlannerConfig`, `PlannerPokemonKey`, `PlannerGender`, `BreedingPlanResult`, `PlannerPlacement`, and hook method names are consistent across tasks.
