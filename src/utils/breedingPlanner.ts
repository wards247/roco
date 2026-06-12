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

export interface PlannerFemaleCoverDetail {
  female: PlannerInstance;
  coveredMales: PlannerMaleSlot[];
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
  femaleCoverDetails: PlannerFemaleCoverDetail[];
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

const GRID_SIZE = 5;
const DEFAULT_NEST_COUNT = 10;
const MAX_PLANNER_COUNT = 10;
const FINE_GRID = 10;

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
  defaultEntry: BreedingPlannerEntryConfig = { enabled: true, count: 1 },
): BreedingPlannerConfig => {
  const sanitizedConfig = sanitizeBreedingPlannerConfig(config);
  const entries = { ...sanitizedConfig.entries };

  pokemon.forEach((owned) => {
    if (owned.can_hatch === false || (owned.gender !== 'male' && owned.gender !== 'female')) {
      return;
    }

    const key = getPlannerPokemonKey(owned.base_id, owned.gender);
    if (!entries[key]) {
      entries[key] = defaultEntry;
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

/**
 * 配种范围约束 —— 这是整个布局算法的核心限制条件。
 *
 * 洛克王国生蛋规则：两个精灵在窝位中必须处于相邻或间隔 1 个窝位的距离。
 * 具体到 5×5 网格坐标：
 *   - 曼哈顿距离（dx + dy）≤ 2.5：即最多隔 2 格（水平2+垂直0，或水平1+垂直1）
 *   - 切比雪夫距离（max(dx, dy)）≤ 2：不能出现对角 3 格的极端情况
 *
 * 举例：雌性在 (2,2)，兼容的雄性可以放在：
 *   (0,2) 距离 2 ✓    (1,1) 距离 2 ✓    (2,2) 距离 0 ✓
 *   (2,0) 距离 2 ✓    (3,3) 距离 2 ✓    (4,2) 距离 2 ✓
 *   但 (0,0) 距离 4 ✗    (0,4) 距离 4 ✗
 */
const isWithinBreedingRange = (left: PlannerCoord, right: PlannerCoord) => {
  const dx = Math.abs(left.x - right.x);
  const dy = Math.abs(left.y - right.y);
  return dx + dy <= 2.5 && Math.max(dx, dy) <= 2;
};

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

/**
 * 位置压实算法（后处理）
 *
 * 问题：compactPlacement 只裁剪了外围空白边缘（减去 minX/minY），
 * 但格子之间内部的空隙没有被填充。比如雄性在 (1,3) 和 (3,3)，
 * 中间 (2,3) 空着，compactPlacement 不会把 (3,3) 左移到 (2,3)。
 *
 * 做法：3 轮迭代，每轮先按 X 坐标排序逐个尝试左移，再按 Y 排序尝试上移。
 * 左移时按 X 从小到大（即从左到右），这样右边的物品能填补左边移走后空出的位置。
 * 上移同理，从上到下处理。
 *
 * 移动约束（保证不破坏配种图的有效性）：
 *   - 不能移出网格边界
 *   - 不能与其他物品重叠
 *   - 雄性移动后，所有与之兼容的雌性仍必须在配种距离内（曼哈顿 ≤ 2.5）
 *   - 雌性移动后，所有与之兼容的雄性仍能到达她的新位置
 *
 * 为什么 3 轮：第 1 轮左移可能让某个格子空出，第 2 轮上移时其他物品可以填进去，
 * 第 3 轮再做一次左移收尾。
 */
const tightenPlacement = (
  maleCoords: PlannerCoord[],
  femaleCoords: PlannerCoord[],
  femaleInstances: PlannerInstance[],
  maleSlots: PlannerMaleSlot[],
): { maleCoords: PlannerCoord[]; femaleCoords: PlannerCoord[] } => {
  const mc = maleCoords.map((c) => ({ ...c }));
  const fc = femaleCoords.map((c) => ({ ...c }));

  const makeOccupied = (): Set<string> => {
    const s = new Set<string>();
    mc.forEach((c) => s.add(`${c.x},${c.y}`));
    fc.forEach((c) => s.add(`${c.x},${c.y}`));
    return s;
  };

  // Try to move a male left/up without breaking constraints
  const tryMoveMale = (mi: number, nx: number, ny: number, occ: Set<string>): boolean => {
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return false;
    if (occ.has(`${nx},${ny}`)) return false;
    // Check all compatible females can still reach this male
    for (let fi = 0; fi < fc.length; fi++) {
      if (!areCompatible(maleSlots[mi], femaleInstances[fi])) continue;
      if (!isWithinBreedingRange({ x: nx, y: ny }, fc[fi])) return false;
    }
    return true;
  };

  // Try to move a female left/up without breaking constraints
  const tryMoveFemale = (fi: number, nx: number, ny: number, occ: Set<string>): boolean => {
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return false;
    if (occ.has(`${nx},${ny}`)) return false;
    // Check all compatible males can still reach this female
    for (let mi = 0; mi < mc.length; mi++) {
      if (!areCompatible(maleSlots[mi], femaleInstances[fi])) continue;
      if (!isWithinBreedingRange(mc[mi], { x: nx, y: ny })) return false;
    }
    return true;
  };

  for (let pass = 0; pass < 3; pass++) {
    // Move items left: process left-to-right so right items can fill gaps
    const allLeft = [
      ...mc.map((c, i) => ({ x: c.x, y: c.y, type: 'male' as const, index: i })),
      ...fc.map((c, i) => ({ x: c.x, y: c.y, type: 'female' as const, index: i })),
    ].sort((a, b) => a.x - b.x);

    for (const item of allLeft) {
      const occ = makeOccupied();
      occ.delete(`${item.x},${item.y}`);
      for (let nx = item.x - 1; nx >= 0; nx--) {
        if (item.type === 'male') {
          if (!tryMoveMale(item.index, nx, item.y, occ)) break;
          mc[item.index] = { x: nx, y: item.y };
          item.x = nx;
        } else {
          if (!tryMoveFemale(item.index, nx, item.y, occ)) break;
          fc[item.index] = { x: nx, y: item.y };
          item.x = nx;
        }
      }
    }

    // Move items up: process top-to-bottom so bottom items can fill gaps
    const allUp = [
      ...mc.map((c, i) => ({ x: c.x, y: c.y, type: 'male' as const, index: i })),
      ...fc.map((c, i) => ({ x: c.x, y: c.y, type: 'female' as const, index: i })),
    ].sort((a, b) => a.y - b.y);

    for (const item of allUp) {
      const occ = makeOccupied();
      occ.delete(`${item.x},${item.y}`);
      for (let ny = item.y - 1; ny >= 0; ny--) {
        if (item.type === 'male') {
          if (!tryMoveMale(item.index, item.x, ny, occ)) break;
          mc[item.index] = { x: item.x, y: ny };
          item.y = ny;
        } else {
          if (!tryMoveFemale(item.index, item.x, ny, occ)) break;
          fc[item.index] = { x: item.x, y: ny };
          item.y = ny;
        }
      }
    }
  }

  return { maleCoords: mc, femaleCoords: fc };
};

const createPlacementLines = (
  maleSlots: PlannerMaleSlot[],
  femaleInstances: PlannerInstance[],
  maleCoords: PlannerCoord[],
  femaleCoords: PlannerCoord[],
): PlannerLine[] =>
  maleCoords.flatMap((maleCoord, maleIndex) =>
    femaleCoords.flatMap((femaleCoord, femaleIndex) => {
      if (!isWithinBreedingRange(maleCoord, femaleCoord) || !areCompatible(maleSlots[maleIndex], femaleInstances[femaleIndex])) {
        return [];
      }

      return [{
        maleIndex,
        femaleIndex,
        distance: getDistance(maleCoord, femaleCoord),
        locked: maleSlots[maleIndex].lockedForIds.includes(femaleInstances[femaleIndex].id),
      }];
    }),
  );

/**
 * V5 位置求解器（核心算法）
 * V5 位置求解器（核心算法）
 *
 * 在 5×5 网格中为所有雄性+雌性寻找位置，使所有兼容的配对都在配种范围内。
 *
 * ── 整体策略 ──
 * 这是"随机放雄性 + DFS 回溯放雌性"的蒙特卡洛方法，跑 3000 次取最优：
 *
 * 第 1 步：随机放置雄性
 *   从 centerOrderedCells（按离中心距离排序的格子列表）中随机打乱，
 *   依次为每个雄性选取一个未被占用的格子。
 *   centerOrderedCells 优先选靠近网格中心的格子，这样雄性天然聚拢在中央。
 *
 * 第 2 步：DFS 回溯放置雌性
 *   每个雌性有一个 constraints 数组，指定了她与每个兼容雄性的
 *   最小/最大距离要求。约束的计算：
 *     - minDist：如果该雄性有"独占"的雌性（即只有它能配的雌性），
 *       则这个间距至少为 2，避免独占雌性离太近占掉其他雄性的位置
 *     - maxDist：兼容雄性数量越少，距离限制越宽松（🐻‍❄️ 不得不放远点）；
 *       兼容雄性越多，距离要求越严（必须靠近些才能配对到多个）
 *   用 DFS 按约束从小到大尝试每个候选位置（优先选离兼容雄性总和最近的位置），
 *   如果不能放置所有雌性则回退，换一批雄性位置重试。
 *
 * 第 3 步：评分选最优
 *   对每种成功布局计算 score = 包围盒面积 × 1000 + 离散度。
 *   离散度 = 所有精灵到几何中心的曼哈顿距离之和，面积相同的情况下
 *   选精灵更聚集（离散度更小）的方案。
 *   跑 3000 次后，选 score 最小的布局。
 *
 * 第 4 步：后处理
 *   1. compactPlacement：裁剪外围空白
 *   2. centerPlacement：居中到网格
 *   3. tightenPlacement：压实内部空隙
 *   4. createPlacementLines：计算最终的连线
 */
const solvePlacementV5 = (
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
  let bestScore = Infinity;

  // Center-biased cell ordering for better compactness
  const centerOrderedCells: PlannerCoord[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      centerOrderedCells.push({ x, y });
    }
  }
  centerOrderedCells.sort((a, b) => {
    const da = Math.abs(a.x - 2) + Math.abs(a.y - 2);
    const db = Math.abs(b.x - 2) + Math.abs(b.y - 2);
    return da - db;
  });

  const getNextFreeCoord = (occupied: Set<number>): PlannerCoord => {
    for (const cell of centerOrderedCells) {
      if (!occupied.has(cell.y * GRID_SIZE + cell.x)) {
        return cell;
      }
    }
    return { x: 0, y: 0 };
  };

  const getRandomFreeCoord = (occupied: Set<number>): PlannerCoord => {
    const shuffled = [...centerOrderedCells].sort(() => random() - 0.5);
    for (const coord of shuffled) {
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
    for (const cell of centerOrderedCells) {
      const key = cell.y * GRID_SIZE + cell.x;
      if (occupied.has(key)) {
        continue;
      }
      if (female.constraints.some((constraint) => {
        const distance = getDistance(cell, maleCoords[constraint.maleIndex]);
        return distance >= constraint.minDist && distance <= constraint.maxDist;
      })) {
        candidates.push(cell);
      }
    }

    candidates.sort((left, right) => {
      // 先按最近兼容雄性的距离排，再按总距离排
      const leftMin = Math.min(...female.constraints.map((c) => getDistance(left, maleCoords[c.maleIndex])));
      const rightMin = Math.min(...female.constraints.map((c) => getDistance(right, maleCoords[c.maleIndex])));
      if (leftMin !== rightMin) return leftMin - rightMin;
      const leftSum = female.constraints.reduce((s, c) => s + getDistance(left, maleCoords[c.maleIndex]), 0);
      const rightSum = female.constraints.reduce((s, c) => s + getDistance(right, maleCoords[c.maleIndex]), 0);
      return leftSum - rightSum;
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

  for (let attempt = 0; attempt < 3000; attempt += 1) {
    if (attempt % 500 === 0) {
      console.log(`[位置图] 蒙特卡洛 ${attempt}/3000`);
    }

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
    const minX = Math.min(...all.map((coord) => coord.x));
    const maxX = Math.max(...all.map((coord) => coord.x));
    const minY = Math.min(...all.map((coord) => coord.y));
    const maxY = Math.max(...all.map((coord) => coord.y));
    const area = (maxX - minX + 1) * (maxY - minY + 1);

    // Tighter cluster tiebreaker: sum of distances from centroid
    const cx = all.reduce((s, c) => s + c.x, 0) / all.length;
    const cy = all.reduce((s, c) => s + c.y, 0) / all.length;
    const spread = all.reduce((s, c) => s + Math.abs(c.x - cx) + Math.abs(c.y - cy), 0);
    const score = area * 1000 + spread;

    if (score < bestScore) {
      bestScore = score;
      best = compacted;
    }
  }

  if (!best) {
    return undefined;
  }

  const centered = centerPlacement(best);
  const tightened = tightenPlacement(centered.maleCoords, centered.femaleCoords, femaleInstances, maleSlots);

  return {
    gridSize: GRID_SIZE,
    ...tightened,
    femaleInstances,
    lines: createPlacementLines(maleSlots, femaleInstances, tightened.maleCoords, tightened.femaleCoords),
  };
};

const createFineGridLines = (
  maleSlots: PlannerMaleSlot[],
  femaleInstances: PlannerInstance[],
  maleCoords: PlannerCoord[],
  femaleCoords: PlannerCoord[],
): PlannerLine[] =>
  maleCoords.flatMap((maleCoord, maleIndex) =>
    femaleCoords.flatMap((femaleCoord, femaleIndex) => {
      if (!areCompatible(maleSlots[maleIndex], femaleInstances[femaleIndex])) {
        return [];
      }
      // Fine grid: convert to 7x7 scale for range check
      const dx = (maleCoord.x - femaleCoord.x) / 2;
      const dy = (maleCoord.y - femaleCoord.y) / 2;
      const manhattan = Math.abs(dx) + Math.abs(dy);
      const chebyshev = Math.max(Math.abs(dx), Math.abs(dy));
      if (manhattan > 2.5 || chebyshev > 2) {
        return [];
      }
      return [{
        maleIndex,
        femaleIndex,
        distance: manhattan,
        locked: false,
      }];
    }),
  );

const tryDeterministicPlacement2Male = (
  femaleInstances: PlannerInstance[],
  maleSlots: PlannerMaleSlot[],
): PlannerPlacement | undefined => {
  if (maleSlots.length !== 2) {
    return undefined;
  }
  // Males at (1,2) and (3,2) in 5x5 grid
  const maleCoords: PlannerCoord[] = [
    { x: 1, y: 2 },
    { x: 3, y: 2 },
  ];

  const femaleCoords: PlannerCoord[] = femaleInstances.map((female) => {
    const compatibleIndices = maleSlots.flatMap((male, index) =>
      areCompatible(male, female) ? [index] : [],
    );
    if (compatibleIndices.length === 2) {
      return { x: 2, y: 2 };
    }
    if (compatibleIndices[0] === 0) {
      return { x: 1, y: 1 };
    }
    return { x: 3, y: 1 };
  });

  // Validate: all coords must be within the 7x7 grid
  const allCoords = [...maleCoords, ...femaleCoords];
  if (allCoords.some((c) => c.x < 0 || c.x >= GRID_SIZE || c.y < 0 || c.y >= GRID_SIZE)) {
    return undefined;
  }

  // Validate: all pairs must be within breeding range
  const placementValid = maleCoords.every((mc, mi) =>
    femaleCoords.every((fc, fi) => {
      if (!areCompatible(maleSlots[mi], femaleInstances[fi])) {
        return true; // incompatible pairs don't need range check
      }
      return isWithinBreedingRange(mc, fc);
    }),
  );
  if (!placementValid) {
    return undefined;
  }

  const compacted = compactPlacement({ maleCoords, femaleCoords });
  const centered = centerPlacement(compacted);
  const tightened = tightenPlacement(centered.maleCoords, centered.femaleCoords, femaleInstances, maleSlots);

  return {
    gridSize: GRID_SIZE,
    ...tightened,
    femaleInstances,
    lines: createPlacementLines(maleSlots, femaleInstances, tightened.maleCoords, tightened.femaleCoords),
  };
};

const tryDeterministicPlacement3Male = (
  femaleInstances: PlannerInstance[],
  maleSlots: PlannerMaleSlot[],
): PlannerPlacement | undefined => {
  if (maleSlots.length !== 3) {
    return undefined;
  }
  // Males at (1,1), (3,1), (2,3) in 5x5 grid
  const maleCoords: PlannerCoord[] = [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
    { x: 2, y: 3 },
  ];

  const femaleCoords: PlannerCoord[] = femaleInstances.map((female) => {
    const compatibleIndices = maleSlots.flatMap((male, index) =>
      areCompatible(male, female) ? [index] : [],
    );
    const primaryMale = compatibleIndices[0];
    switch (primaryMale) {
      case 0: return { x: 1, y: 0 };
      case 1: return { x: 3, y: 0 };
      case 2: return { x: 2, y: 4 };
      default: return { x: 2, y: 2 };
    }
  });

  const allCoords = [...maleCoords, ...femaleCoords];
  if (allCoords.some((c) => c.x < 0 || c.x >= GRID_SIZE || c.y < 0 || c.y >= GRID_SIZE)) {
    return undefined;
  }

  const placementValid = maleCoords.every((mc, mi) =>
    femaleCoords.every((fc, fi) => {
      if (!areCompatible(maleSlots[mi], femaleInstances[fi])) {
        return true;
      }
      return isWithinBreedingRange(mc, fc);
    }),
  );
  if (!placementValid) {
    return undefined;
  }

  const compacted = compactPlacement({ maleCoords, femaleCoords });
  const centered = centerPlacement(compacted);
  const tightened = tightenPlacement(centered.maleCoords, centered.femaleCoords, femaleInstances, maleSlots);

  return {
    gridSize: GRID_SIZE,
    ...tightened,
    femaleInstances,
    lines: createPlacementLines(maleSlots, femaleInstances, tightened.maleCoords, tightened.femaleCoords),
  };
};

const solvePlacementFine = (
  femaleInstances: PlannerInstance[],
  maleSlots: PlannerMaleSlot[],
  random: () => number,
): PlannerPlacement | undefined => {
  // Try V5 solver first, then convert integer coords to 14x14 fine grid
  const integerPlacement = solvePlacementV5(femaleInstances, maleSlots, random);
  if (!integerPlacement) {
    return undefined;
  }

  // Convert 7x7 coords to 14x14 fine grid: each integer coord -> fine coord * 2
  const toFine = (c: PlannerCoord) => ({ x: c.x * 2, y: c.y * 2 });
  const maleCoords = integerPlacement.maleCoords.map(toFine);
  const femaleCoords = integerPlacement.femaleCoords.map(toFine);

  return {
    gridSize: FINE_GRID,
    maleCoords,
    femaleCoords,
    femaleInstances,
    lines: createFineGridLines(maleSlots, femaleInstances, maleCoords, femaleCoords),
  };
};

export const buildBreedingPlan = ({
  pokemon,
  config,
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
    femaleCoverDetails: femaleInstances.map((female) => ({ female, coveredMales: [] })),
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
  const femaleCoverDetails = femaleInstances.map((female) => ({
    female,
    coveredMales: maleSlots.filter((male) => areCompatible(male, female)),
  }));
  return {
    femaleInstances,
    maleSlots,
    uncoveredFemales,
    maleCoverDetails,
    femaleCoverDetails,
    femalePairStats: sortFemalePairStats(femaleInstances.map((female) => ({ female, pairCount: 0 }))),
  };
};

const scorePlacement = (p: PlannerPlacement): number => {
  const all = [...p.maleCoords, ...p.femaleCoords];
  const minX = Math.min(...all.map((c) => c.x));
  const maxX = Math.max(...all.map((c) => c.x));
  const minY = Math.min(...all.map((c) => c.y));
  const maxY = Math.max(...all.map((c) => c.y));
  const area = (maxX - minX + 1) * (maxY - minY + 1);
  const cx = all.reduce((s, c) => s + c.x, 0) / all.length;
  const cy = all.reduce((s, c) => s + c.y, 0) / all.length;
  const spread = all.reduce((s, c) => s + Math.abs(c.x - cx) + Math.abs(c.y - cy), 0);
  return area * 1000 + spread;
};

/**
 * 位置生成入口 —— 自适应多轮尝试 + 聚合度检查
 *
 * 三层策略（按优先级）：
 *
 * 1️⃣ 确定性布局（2公/3公）
 *    2 雄性时使用预计算模板 (1,2)(3,2)，3 雄性时使用模板 (1,1)(3,1)(2,3)。
 *    这些模板保证雄性之间和与兼容雌性的距离都在配种范围内，
 *    且经过 tightenPlacement 压实。确定性方案只需跑一次，结果固定。
 *
 * 2️⃣ V5 自适应循环（最多 10 次）
 *    每次调用 solvePlacementV5（内部跑 3000 次随机），返回的布局已经过
 *    centerPlacement + tightenPlacement 处理。然后 scorePlacement 评分。
 *
 *    聚合度判断：
 *      - 完美聚合：包围盒面积 == 精灵数量，说明每个格子都占满 → 立即返回
 *      - 够好：面积 ≤ 精灵数 × 1.3，空隙率 ≤ 30% → 立即返回
 *      - 收敛：连续 5 次新布局都没有改善 bestScore → 不可能更好了，退出
 *      - 上限：最多 10 次
 *
 *    这样做的好处：
 *      - 运气好时第 1 次就完美聚合，不需要额外尝试
 *      - 运气差时最多试 10 次，比固定 3 次找到好结果概率大
 *      - 收敛检测避免在已经最优的情况下浪费算力
 *
 * 3️⃣ 精细网格回退（solvePlacementFine）
 *    当 V5 连 3000×10 次都找不到有效布局时（极少发生），
 *    使用 solvePlacementFine 在 10×10 精细网格上求解。
 */
export const generateBreedingPlacement = (
  plan: BreedingPlanResult,
  random: () => number = Math.random,
): BreedingPlanResult => {
  if (plan.error || plan.femaleInstances.length === 0 || plan.maleSlots.length === 0) {
    return plan;
  }

  const uncoveredFemaleIds = new Set(plan.uncoveredFemales.map((female) => female.id));
  const coveredFemales = plan.femaleInstances.filter((female) => !uncoveredFemaleIds.has(female.id));
  if (coveredFemales.length === 0) {
    return {
      ...plan,
      placement: undefined,
      femaleCoverDetails: plan.femaleInstances.map((female) => ({ female, coveredMales: plan.maleSlots })),
      femalePairStats: sortFemalePairStats(plan.femaleInstances.map((female) => ({ female, pairCount: 0 }))),
    };
  }

  const maleCount = plan.maleSlots.length;

  // 1) 确定性方案（2或3雄性），只需跑一次
  let placement: PlannerPlacement | undefined;
  if (maleCount <= 2) {
    placement = tryDeterministicPlacement2Male(coveredFemales, plan.maleSlots);
  } else if (maleCount === 3) {
    placement = tryDeterministicPlacement3Male(coveredFemales, plan.maleSlots);
  }

  // 2) V5 自适应：生成后检查聚合度，不达标就重试，达标就提前退出
  if (!placement) {
    const itemCount = coveredFemales.length + plan.maleSlots.length;
    const maxAttempts = 10;
    let bestScore = Infinity;
    let stalledCount = 0;

    for (let i = 0; i < maxAttempts; i++) {
      const candidate = solvePlacementV5(coveredFemales, plan.maleSlots, random);
      if (!candidate) continue;

      const s = scorePlacement(candidate);
      if (s < bestScore) {
        bestScore = s;
        placement = candidate;
        stalledCount = 0;

        // 计算聚合程度：包围盒面积 / 精灵数，越接近 1 越紧凑
        const all = [...candidate.maleCoords, ...candidate.femaleCoords];
        const minX = Math.min(...all.map((c) => c.x));
        const maxX = Math.max(...all.map((c) => c.x));
        const minY = Math.min(...all.map((c) => c.y));
        const maxY = Math.max(...all.map((c) => c.y));
        const area = (maxX - minX + 1) * (maxY - minY + 1);
        const ratio = (area / itemCount).toFixed(2);

        console.log(`[位置图] 第${i + 1}次生成 面积=${area} 精灵数=${itemCount} 聚合比=${ratio}`);

        // 包围盒无损（area == itemCount，完全没有空隙）→ 完美，直接返回
        if (area <= itemCount) {
          console.log(`[位置图] 完美聚合，提前退出`);
          break;
        }
        // 空隙率 ≤ 30% → 够好了，返回
        if (area <= itemCount * 1.3) {
          console.log(`[位置图] 聚合度达标，提前退出`);
          break;
        }
      } else {
        stalledCount++;
        // 连续 5 次没改善 → 收敛了，不再浪费算力
        if (stalledCount >= 5) {
          console.log(`[位置图] 连续5次未改善，收敛退出`);
          break;
        }
      }
    }
  }

  // 3) 精细网格回退
  if (!placement) {
    console.log(`[位置图] V5 求解失败，尝试精细网格（${FINE_GRID}×${FINE_GRID}）...`);
    placement = solvePlacementFine(coveredFemales, plan.maleSlots, random);
  }
  if (!placement) {
    console.log(`[位置图] 精细网格回退也失败，无法生成位置图`);
  }

  const femalePairStats = plan.femaleInstances.map((female) => {
    const placementFemaleIndex = coveredFemales.findIndex((candidate) => candidate.id === female.id);
    const pairCount = placementFemaleIndex === -1
      ? 0
      : placement?.lines.filter((line) => line.femaleIndex === placementFemaleIndex).length ?? 0;

    return { female, pairCount };
  });

  const femaleCoverDetails = plan.femaleInstances.map((female) => ({
    female,
    coveredMales: plan.maleSlots.filter((male) =>
      plan.femaleInstances.some((fi) => fi.id === female.id)
      && areCompatible(male, female),
    ),
  }));

  return {
    ...plan,
    placement,
    femaleCoverDetails,
    femalePairStats: sortFemalePairStats(femalePairStats),
  };
};

/**
 * Generator 版 generateBreedingPlacement
 *
 * 每次 solvePlacementV5 跑完后 yield 当前进度百分比（1~100），
 * 组件可以通过 setTimeout 分片消费，中间让浏览器渲染进度条。
 * 最终 return 完整 BreedingPlanResult。
 */
export function* generateBreedingPlacementGen(
  plan: BreedingPlanResult,
  random: () => number = Math.random,
): Generator<number, BreedingPlanResult> {
  if (plan.error || plan.femaleInstances.length === 0 || plan.maleSlots.length === 0) {
    return plan;
  }

  const uncoveredFemaleIds = new Set(plan.uncoveredFemales.map((female) => female.id));
  const coveredFemales = plan.femaleInstances.filter((female) => !uncoveredFemaleIds.has(female.id));
  if (coveredFemales.length === 0) {
    console.log(`[位置图] 无可放置雌性（${plan.uncoveredFemales.length} 只全部无兼容雄性）`);
    return {
      ...plan,
      placement: undefined,
      femaleCoverDetails: plan.femaleInstances.map((female) => ({ female, coveredMales: plan.maleSlots })),
      femalePairStats: sortFemalePairStats(plan.femaleInstances.map((female) => ({ female, pairCount: 0 }))),
    };
  }

  const maleCount = plan.maleSlots.length;

  // 1) 确定性方案（2或3雄性），只需跑一次
  let placement: PlannerPlacement | undefined;
  if (maleCount <= 2) {
    placement = tryDeterministicPlacement2Male(coveredFemales, plan.maleSlots);
  } else if (maleCount === 3) {
    placement = tryDeterministicPlacement3Male(coveredFemales, plan.maleSlots);
  }

  // 2) V5 自适应（分片，每次 yield 进度）
  if (!placement) {
    const itemCount = coveredFemales.length + plan.maleSlots.length;
    const maxAttempts = 10;
    let bestScore = Infinity;
    let stalledCount = 0;

    console.log(`[位置图] 开始计算：${coveredFemales.length}雌×${plan.maleSlots.length}雄，网格${GRID_SIZE}×${GRID_SIZE}`);
    coveredFemales.forEach((f) => console.log(`  [位置图]   雌 ${f.displayName}(id=${f.baseId}) 蛋组=[${f.eggGroupIds.join(',')}]`));
    plan.maleSlots.forEach((m) => console.log(`  [位置图]   雄 ${m.displayName}(id=${m.baseId}) 蛋组=[${m.eggGroupIds.join(',')}]`));

    for (let i = 0; i < maxAttempts; i++) {
      const candidate = solvePlacementV5(coveredFemales, plan.maleSlots, random);
      yield Math.round(((i + 1) / maxAttempts) * 100);

      if (!candidate) continue;

      const s = scorePlacement(candidate);
      const all = [...candidate.maleCoords, ...candidate.femaleCoords];
      const minX = Math.min(...all.map((c) => c.x));
      const maxX = Math.max(...all.map((c) => c.x));
      const minY = Math.min(...all.map((c) => c.y));
      const maxY = Math.max(...all.map((c) => c.y));
      const area = (maxX - minX + 1) * (maxY - minY + 1);

      console.log(`[位置图] 第${i + 1}次 面积=${area} 精灵数=${itemCount} 聚合比=${(area / itemCount).toFixed(2)}`);

      if (s < bestScore) {
        bestScore = s;
        placement = candidate;
        stalledCount = 0;

        if (area <= itemCount) {
          console.log(`[位置图] 完美聚合，提前退出`);
          break;
        }
        if (area <= itemCount * 1.3) {
          console.log(`[位置图] 聚合度达标，提前退出`);
          break;
        }
      } else {
        stalledCount++;
        if (stalledCount >= 5) {
          console.log(`[位置图] 连续5次未改善，收敛退出`);
          break;
        }
      }
    }
  }

  // 3) 精细网格回退
  if (!placement) {
    console.log(`[位置图] V5 求解失败，尝试精细网格（${FINE_GRID}×${FINE_GRID}）...`);
    placement = solvePlacementFine(coveredFemales, plan.maleSlots, random);
  }
  if (!placement) {
    console.log(`[位置图] 精细网格回退也失败，无法生成位置图`);
  }

  const femalePairStats = plan.femaleInstances.map((female) => {
    const placementFemaleIndex = coveredFemales.findIndex((candidate) => candidate.id === female.id);
    const pairCount = placementFemaleIndex === -1
      ? 0
      : placement?.lines.filter((line) => line.femaleIndex === placementFemaleIndex).length ?? 0;

    return { female, pairCount };
  });

  const femaleCoverDetails = plan.femaleInstances.map((female) => ({
    female,
    coveredMales: plan.maleSlots.filter((male) =>
      plan.femaleInstances.some((fi) => fi.id === female.id)
      && areCompatible(male, female),
    ),
  }));

  return {
    ...plan,
    placement,
    femaleCoverDetails,
    femalePairStats: sortFemalePairStats(femalePairStats),
  };
}
