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

export interface BuildBreedingPlanInput {
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
const MAX_PLANNER_COUNT = 10;

export const getPlannerPokemonKey = (baseId: number, gender: PlannerGender): PlannerPokemonKey =>
  `${baseId}:${gender}`;

export const sanitizeBreedingPlannerConfig = (
  config: Partial<BreedingPlannerConfig> | null | undefined,
): BreedingPlannerConfig => {
  const rawNestCount = Number(config?.nestCount);
  const flooredNestCount = Math.floor(rawNestCount);
  const nestCount = Number.isFinite(flooredNestCount) && flooredNestCount >= 1 && flooredNestCount <= 10
    ? flooredNestCount
    : DEFAULT_NEST_COUNT;
  const entries: BreedingPlannerConfig['entries'] = {};

  Object.entries(config?.entries ?? {}).forEach(([key, value]) => {
    if (!/^\d+:(male|female)$/.test(key)) {
      return;
    }

    const count = Number(value?.count);
    entries[key as PlannerPokemonKey] = {
      enabled: Boolean(value?.enabled),
      count: Number.isFinite(count) ? Math.max(0, Math.min(MAX_PLANNER_COUNT, Math.floor(count))) : 0,
    };
  });

  return { nestCount, entries };
};

export const mergeBreedingPlannerConfigWithPokemon = (
  pokemon: MyPokemon[],
  config: BreedingPlannerConfig,
): BreedingPlannerConfig => {
  const sanitizedConfig = sanitizeBreedingPlannerConfig(config);
  const entries = { ...sanitizedConfig.entries };

  pokemon.forEach((owned) => {
    if (owned.can_hatch === false || (owned.gender !== 'male' && owned.gender !== 'female')) {
      return;
    }

    const key = getPlannerPokemonKey(owned.base_id, owned.gender);
    if (!entries[key]) {
      entries[key] = { enabled: true, count: 1 };
    }
  });

  return { ...sanitizedConfig, entries };
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

const sortFemalePairStats = (stats: PlannerFemalePairStat[]) =>
  [...stats].sort((left, right) =>
    right.pairCount - left.pairCount
    || left.female.displayName.localeCompare(right.female.displayName, 'zh-Hans-CN'),
  );

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

const compactPlacement = (placement: Omit<PlannerPlacement, 'gridSize' | 'femaleInstances' | 'lines'>) => {
  const all = [...placement.maleCoords, ...placement.femaleCoords];
  const minX = Math.min(...all.map((coord) => coord.x));
  const minY = Math.min(...all.map((coord) => coord.y));

  return {
    maleCoords: placement.maleCoords.map((coord) => ({ x: coord.x - minX, y: coord.y - minY })),
    femaleCoords: placement.femaleCoords.map((coord) => ({ x: coord.x - minX, y: coord.y - minY })),
  };
};

const centerPlacement = (placement: Omit<PlannerPlacement, 'gridSize' | 'femaleInstances' | 'lines'>) => {
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
      areCompatible(male, female)
        && maleSlots.filter((candidate) => areCompatible(candidate, female)).length === 1,
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

  let best: Omit<PlannerPlacement, 'gridSize' | 'femaleInstances' | 'lines'> | undefined;
  let bestArea = Infinity;

  const getNextFreeCoord = (occupied: Set<number>): PlannerCoord => {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (!occupied.has(y * GRID_SIZE + x)) {
          return { x, y };
        }
      }
    }

    return { x: 0, y: 0 };
  };

  const getRandomFreeCoord = (occupied: Set<number>): PlannerCoord => {
    for (let attempt = 0; attempt < GRID_SIZE * GRID_SIZE; attempt += 1) {
      const coord = {
        x: Math.floor(random() * GRID_SIZE),
        y: Math.floor(random() * GRID_SIZE),
      };
      if (!occupied.has(coord.y * GRID_SIZE + coord.x)) {
        return coord;
      }
    }

    return getNextFreeCoord(occupied);
  };

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
      const coord = getRandomFreeCoord(occupied);
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
      (Math.max(...all.map((coord) => coord.x)) - Math.min(...all.map((coord) => coord.x)) + 1)
      * (Math.max(...all.map((coord) => coord.y)) - Math.min(...all.map((coord) => coord.y)) + 1);

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
    femalePairStats: sortFemalePairStats(femaleInstances.map((female) => ({ female, pairCount: 0 }))),
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
      if (
        newCoverage > bestNewCoverage
        || (newCoverage === bestNewCoverage && coveredFemales.length > bestTotalCoverage)
      ) {
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
    });

  return {
    femaleInstances,
    maleSlots,
    uncoveredFemales,
    maleCoverDetails,
    placement,
    femalePairStats: sortFemalePairStats(femalePairStats),
  };
};
