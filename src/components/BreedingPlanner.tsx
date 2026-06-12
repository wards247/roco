import { useMemo, useState, useRef, useEffect } from 'react';
import type { MyPokemon, Pokemon } from '../types';
import { useBreedingPlannerConfig } from '../hooks/useBreedingPlannerConfig';
import { getVisibleOwnedGendersForBaseIds } from '../utils/ownedGenders';
import { toPublicAssetUrl } from '../utils/publicAssets';
import { shinyPets } from '../utils/shinyPets';
import {
  buildBreedingPlan,
  generateBreedingPlacementGen,
  getMyPokemonEggGroupIdsForPlanner,
  getPlannerPokemonKey,
} from '../utils/breedingPlanner';
import type {
  BreedingPlannerConfig,
  BreedingPlannerEntryConfig,
  BreedingPlanResult,
  PlannerGender,
  PlannerInstance,
  PlannerMaleSlot,
  PlannerPokemonKey,
} from '../utils/breedingPlanner';
import './BreedingPlanner.css';

interface BreedingPlannerProps {
  pokemon: MyPokemon[];
  allPokemon: Pokemon[];
}

type PlannerMode = 'normal' | 'shiny';

type UpdateEntryHandler = (
  baseId: number,
  gender: PlannerGender,
  patch: Partial<BreedingPlannerEntryConfig>,
) => void;

type CountChangeHandler = (baseId: number, gender: PlannerGender, rawValue: string) => void;
type CountBlurHandler = (baseId: number, gender: PlannerGender) => void;

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.floor(value)));
};

const formatEggGroups = (pokemon: MyPokemon) => {
  const eggGroupIds = getMyPokemonEggGroupIdsForPlanner(pokemon);

  return eggGroupIds.length > 0
    ? eggGroupIds.map((eggGroupId) => `蛋组 ${eggGroupId}`).join(' / ')
    : '暂无蛋组';
};

const getDisplayName = (pokemon: MyPokemon) => pokemon.display_name || `精灵 #${pokemon.base_id}`;

const truncateName = (name: string, maxLength = 5) =>
  name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;

const getInstanceLabel = (instance: PlannerInstance | PlannerMaleSlot | undefined) =>
  instance ? truncateName(instance.displayName) : '';

const NORMAL_PLANNER_STORAGE_KEY = 'roco_breeding_planner_config';
const SHINY_PLANNER_STORAGE_KEY = 'roco_breeding_planner_shiny_config';
const NORMAL_DEFAULT_ENTRY = { enabled: true, count: 1 };
const SHINY_DEFAULT_ENTRY = { enabled: false, count: 1 };

const renderPokemonRows = (
  entries: MyPokemon[],
  gender: PlannerGender,
  config: BreedingPlannerConfig,
  countDrafts: Partial<Record<PlannerPokemonKey, string>>,
  onUpdateEntry: UpdateEntryHandler,
  onCountChange: CountChangeHandler,
  onCountBlur: CountBlurHandler,
  ownedKeys: Set<PlannerPokemonKey>,
) => (
  <div className="breeding-planner__list" role="list">
    {entries.map((entry) => {
      const key = getPlannerPokemonKey(entry.base_id, gender);
      const itemConfig = config.entries[key] ?? { enabled: true, count: 1 };
      const countValue = countDrafts[key] ?? itemConfig.count;
      const name = getDisplayName(entry);
      const isOwned = ownedKeys.has(key);

      return (
        <div
          className={isOwned ? `breeding-planner__row breeding-planner__row--owned-${gender}` : 'breeding-planner__row'}
          role="listitem"
          key={key}
        >
          <label className="breeding-planner__check">
            <input
              type="checkbox"
              checked={itemConfig.enabled}
              onChange={(event) => onUpdateEntry(entry.base_id, gender, { enabled: event.target.checked })}
            />
            <span className="breeding-planner__sr-only">启用{name}</span>
          </label>
          <img
            className="breeding-planner__avatar"
            src={toPublicAssetUrl(entry.avatar_url || `/pets/head/${entry.base_id}.webp`)}
            alt=""
            loading="lazy"
          />
          <div className="breeding-planner__info">
            <div className="breeding-planner__name" title={name}>{name}</div>
            <div className="breeding-planner__egg-groups">{formatEggGroups(entry)}</div>
          </div>
          <label className="breeding-planner__count">
            <span></span>
            <input
              type="number"
              min={0}
              max={10}
              value={countValue}
              onChange={(event) => onCountChange(entry.base_id, gender, event.target.value)}
              onBlur={() => onCountBlur(entry.base_id, gender)}
            />
          </label>
        </div>
      );
    })}
  </div>
);

const BreedingPlanGrid = ({ result }: { result: BreedingPlanResult }) => {
  if (!result.placement) {
    return <div className="breeding-planner__empty-result">当前方案暂无可绘制配对图。</div>;
  }

  const { placement } = result;
  const viewSize = 420;
  const isFineGrid = placement.gridSize > 5;
  const cellSize = viewSize / placement.gridSize;
  const getCenter = (coord: { x: number; y: number }) => ({
    x: coord.x * cellSize + cellSize / 2,
    y: coord.y * cellSize + cellSize / 2,
  });

  // Deduplicate occupied 2×2 blocks (for fine grid block backgrounds)
  const occupiedBlocks = new Set<string>();
  if (isFineGrid) {
    const allCoords = [...placement.maleCoords, ...placement.femaleCoords];
    allCoords.forEach((coord) => {
      const bx = Math.floor(coord.x / 2);
      const by = Math.floor(coord.y / 2);
      occupiedBlocks.add(`${bx},${by}`);
    });
  }

  const gridLines = placement.gridSize;
  const majorStep = isFineGrid ? 2 : 1;
  const majorCellSize = isFineGrid ? cellSize * 2 : cellSize;
  const nodeBoxSize = majorCellSize - 4;
  const nodeHalf = nodeBoxSize / 2;

  return (
    <svg
      className="breeding-planner__grid"
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      role="img"
      aria-label="配对网格"
    >
      {/* Cell grid lines */}
      {Array.from({ length: gridLines + 1 }, (_, i) => (
        <line
          key={`gh-${i}`}
          className={i % majorStep === 0 ? 'breeding-planner__major-line' : 'breeding-planner__fine-line'}
          x1={0}
          y1={i * cellSize}
          x2={viewSize}
          y2={i * cellSize}
        />
      ))}
      {Array.from({ length: gridLines + 1 }, (_, i) => (
        <line
          key={`gv-${i}`}
          className={i % majorStep === 0 ? 'breeding-planner__major-line' : 'breeding-planner__fine-line'}
          x1={i * cellSize}
          y1={0}
          x2={i * cellSize}
          y2={viewSize}
        />
      ))}

      {/* 2×2 block backgrounds for fine grid */}
      {[...occupiedBlocks].map((key) => {
        const [bx, by] = key.split(',').map(Number);
        return (
          <rect
            key={`block-${key}`}
            className="breeding-planner__cell-block"
            x={bx * majorCellSize + 2}
            y={by * majorCellSize + 2}
            width={nodeBoxSize}
            height={nodeBoxSize}
            rx={8}
          />
        );
      })}

      {placement.lines.map((line) => {
        const maleCoord = placement.maleCoords[line.maleIndex];
        const femaleCoord = placement.femaleCoords[line.femaleIndex];
        const start = getCenter(maleCoord);
        const end = getCenter(femaleCoord);

        return (
          <line
            key={`${line.maleIndex}-${line.femaleIndex}`}
            className="breeding-planner__line"
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
          />
        );
      })}

      {placement.femaleCoords.map((coord, index) => {
        const center = getCenter(coord);
        const female = placement.femaleInstances[index];

        return (
          <g key={female?.id ?? `female-${index}`} className="breeding-planner__node">
            <title>{female?.displayName ?? '雌性'}</title>
            <rect
              className="breeding-planner__node-box breeding-planner__node-box--female"
              x={center.x - nodeHalf}
              y={center.y - nodeHalf}
              width={nodeBoxSize}
              height={nodeBoxSize}
              rx={8}
            />
            <text x={center.x} y={center.y - 6} textAnchor="middle">
              ♀
            </text>
            <text x={center.x} y={center.y + 12} textAnchor="middle">
              {getInstanceLabel(female)}
            </text>
          </g>
        );
      })}

      {placement.maleCoords.map((coord, index) => {
        const center = getCenter(coord);
        const male = result.maleSlots[index];

        return (
          <g key={male?.id ?? `male-${index}`} className="breeding-planner__node">
            <title>{male?.displayName ?? '雄性'}</title>
            <rect
              className="breeding-planner__node-box breeding-planner__node-box--male"
              x={center.x - nodeHalf}
              y={center.y - nodeHalf}
              width={nodeBoxSize}
              height={nodeBoxSize}
              rx={8}
            />
            <text x={center.x} y={center.y - 6} textAnchor="middle">
              ♂
            </text>
            <text x={center.x} y={center.y + 12} textAnchor="middle">
              {getInstanceLabel(male)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const BreedingPlanner = ({ pokemon, allPokemon }: BreedingPlannerProps) => {
  const [mode, setMode] = useState<PlannerMode>('normal');
  const normalPlannerPokemon = useMemo(
    () => pokemon.filter((entry) => entry.can_hatch !== false && (entry.gender === 'male' || entry.gender === 'female')),
    [pokemon],
  );
  const shinyRelatedBaseIdsById = useMemo(
    () =>
      new Map(
        shinyPets.map((pet) => [
          pet.id,
          [
            pet.id,
            ...allPokemon
              .filter((entry) => entry.base_id === pet.id || entry.family_chain.includes(pet.displayName))
              .map((entry) => entry.base_id),
          ],
        ]),
      ),
    [allPokemon],
  );
  const shinyPlannerPokemon = useMemo(
    () =>
      shinyPets.flatMap((pet): MyPokemon[] => {
        const relatedIds = shinyRelatedBaseIdsById.get(pet.id) ?? [pet.id];
        const eggGroupIds = [
          ...new Set(
            allPokemon
              .filter((entry) =>
                relatedIds.includes(entry.base_id)
                && entry.hatch_status_text === '可生蛋'
                && entry.egg_group_id > 0,
              )
              .map((entry) => entry.egg_group_id),
          ),
        ];

        if (eggGroupIds.length === 0) {
          return [];
        }

        const baseEntry = {
          base_id: pet.id,
          egg_group_id: eggGroupIds[0],
          egg_group_ids: eggGroupIds,
          can_hatch: true,
          is_mine: false,
          display_name: pet.displayName,
          avatar_url: pet.shinyImageUrl,
        };

        return [
          { ...baseEntry, gender: 'female' as const },
          { ...baseEntry, gender: 'male' as const },
        ];
      }),
    [allPokemon, shinyRelatedBaseIdsById],
  );
  const shinyOwnedKeys = useMemo(() => {
    const keys = new Set<PlannerPokemonKey>();

    shinyPets.forEach((pet) => {
      const relatedIds = shinyRelatedBaseIdsById.get(pet.id) ?? [pet.id];
      const ownedGenders = getVisibleOwnedGendersForBaseIds(pokemon, relatedIds);

      ownedGenders.forEach((gender) => {
        if (gender === 'male' || gender === 'female') {
          keys.add(getPlannerPokemonKey(pet.id, gender));
        }
      });
    });

    return keys;
  }, [pokemon, shinyRelatedBaseIdsById]);
  const plannerPokemon = mode === 'shiny' ? shinyPlannerPokemon : normalPlannerPokemon;
  const ownedKeys = mode === 'shiny' ? shinyOwnedKeys : new Set<PlannerPokemonKey>();
  const storageKey = mode === 'shiny' ? SHINY_PLANNER_STORAGE_KEY : NORMAL_PLANNER_STORAGE_KEY;
  const defaultEntry = mode === 'shiny' ? SHINY_DEFAULT_ENTRY : NORMAL_DEFAULT_ENTRY;
  const femalePokemon = useMemo(
    () => plannerPokemon.filter((entry) => entry.gender === 'female'),
    [plannerPokemon],
  );
  const malePokemon = useMemo(
    () => plannerPokemon.filter((entry) => entry.gender === 'male'),
    [plannerPokemon],
  );
  const { config, updateNestCount, updateEntry, setAllEnabled } = useBreedingPlannerConfig(
    plannerPokemon,
    storageKey,
    defaultEntry,
  );
  const [result, setResult] = useState<BreedingPlanResult | null>(null);
  const [placementAttempted, setPlacementAttempted] = useState(false);
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementProgress, setPlacementProgress] = useState(0);
  const [plannerCollapsed, setPlannerCollapsed] = useState(false);
  const [nestCountDraft, setNestCountDraft] = useState<string | null>(null);
  const [countDrafts, setCountDrafts] = useState<Partial<Record<PlannerPokemonKey, string>>>({});

  // Refs for chunked placement execution
  const placementGenRef = useRef<Generator<number, BreedingPlanResult> | null>(null);
  const placementTimerRef = useRef<number | null>(null);

  // Cleanup on unmount: cancel pending chunk
  useEffect(() => () => {
    if (placementTimerRef.current !== null) {
      clearTimeout(placementTimerRef.current);
    }
    placementGenRef.current = null;
  }, []);

  const enabledStats = useMemo(
    () => plannerPokemon.reduce(
      (stats, entry) => {
        const key = getPlannerPokemonKey(entry.base_id, entry.gender as PlannerGender);
        const itemConfig = config.entries[key] ?? { enabled: true, count: 1 };
        if (!itemConfig.enabled) {
          return stats;
        }

        if (entry.gender === 'female') {
          return { ...stats, female: stats.female + itemConfig.count };
        }

        return { ...stats, male: stats.male + itemConfig.count };
      },
      { female: 0, male: 0 },
    ),
    [config.entries, plannerPokemon],
  );

  const handleBuildPlan = () => {
    if (plannerCollapsed) {
      setPlannerCollapsed(false);
      clearResult();
      return;
    }
    setPlacementAttempted(false);
    setResult(buildBreedingPlan({ pokemon: plannerPokemon, config }));
    setPlannerCollapsed(true);
  };

  const handleGeneratePlacement = () => {
    setPlacementAttempted(true);
    setPlacementLoading(true);
    setPlacementProgress(0);

    if (!result || result.error) {
      setPlacementLoading(false);
      setPlacementProgress(100);
      return;
    }

    placementGenRef.current = generateBreedingPlacementGen(result, Math.random);
    runPlacementChunk();
  };

  /** 分片执行：每次 Generator yield 后更新进度，setTimeout 调度下一片 */
  const runPlacementChunk = () => {
    const gen = placementGenRef.current;
    if (!gen) {
      // 组件已卸载或已取消
      setPlacementLoading(false);
      return;
    }

    const { value, done } = gen.next();

    if (done) {
      // Generator 返回了最终结果
      setResult(value as BreedingPlanResult);
      setPlacementLoading(false);
      setPlacementProgress(100);
      placementGenRef.current = null;
    } else {
      // value 是进度百分比（0~100）
      setPlacementProgress(value as number);
      placementTimerRef.current = window.setTimeout(runPlacementChunk, 0);
    }
  };

  const clearResult = () => {
    setPlacementAttempted(false);
    setPlannerCollapsed(false);
    setResult(null);
  };

  const handleNestCountChange = (rawValue: string) => {
    clearResult();
    setNestCountDraft(rawValue);
    if (rawValue === '') {
      return;
    }

    updateNestCount(clampNumber(Number(rawValue), 1, 10));
  };

  const handleNestCountBlur = () => {
    if (nestCountDraft === null) {
      return;
    }

    if (nestCountDraft !== '') {
      updateNestCount(clampNumber(Number(nestCountDraft), 1, 10));
    }
    setNestCountDraft(null);
  };

  const handleUpdateEntry: UpdateEntryHandler = (baseId, gender, patch) => {
    clearResult();
    updateEntry(baseId, gender, patch);
  };

  const handleCountChange: CountChangeHandler = (baseId, gender, rawValue) => {
    const key = getPlannerPokemonKey(baseId, gender);

    clearResult();
    setCountDrafts((drafts) => ({ ...drafts, [key]: rawValue }));
    if (rawValue === '') {
      return;
    }

    updateEntry(baseId, gender, { count: clampNumber(Number(rawValue), 0, 10) });
  };

  const handleCountBlur: CountBlurHandler = (baseId, gender) => {
    const key = getPlannerPokemonKey(baseId, gender);
    const draft = countDrafts[key];
    if (draft === undefined) {
      return;
    }

    if (draft !== '') {
      updateEntry(baseId, gender, { count: clampNumber(Number(draft), 0, 10) });
    }
    setCountDrafts((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[key];
      return nextDrafts;
    });
  };

  const handleSetAllEnabled = (enabled: boolean) => {
    clearResult();
    setAllEnabled(enabled, plannerPokemon);
  };

  const handleModeChange = (nextMode: PlannerMode) => {
    clearResult();
    setCountDrafts({});
    setNestCountDraft(null);
    setMode(nextMode);
  };

  return (
    <section className="breeding-planner" aria-labelledby="breeding-planner-title">
      <div className="breeding-planner__header">
        <div>
          <h3 className="breeding-planner__title" id="breeding-planner-title">配窝助手</h3>
          <p className="breeding-planner__desc">
            {mode === 'shiny'
              ? '筛选赛季异色目标，浅蓝卡片表示我的精灵中已拥有对应性别。'
              : '选择参与配窝的精灵和数量，生成 7x7 窝位摆放参考。'}
          </p>
        </div>
        <div className="breeding-planner__mode-switch" aria-label="配窝助手模式">
          <button
            type="button"
            className={mode === 'normal' ? 'is-active' : ''}
            onClick={() => handleModeChange('normal')}
          >
            普通
          </button>
          <button
            type="button"
            className={mode === 'shiny' ? 'is-active' : ''}
            onClick={() => handleModeChange('shiny')}
          >
            异色
          </button>
        </div>
        <label className="breeding-planner__nest-control">
          <span>窝位数</span>
          <input
            type="number"
            min={1}
            max={10}
            value={nestCountDraft ?? config.nestCount}
            onChange={(event) => handleNestCountChange(event.target.value)}
            onBlur={handleNestCountBlur}
          />
        </label>
      </div>

      <div className="breeding-planner__toolbar">
        <div className="breeding-planner__stats" aria-label="已启用数量">
          <span>已启用雌性 {enabledStats.female}</span>
          <span>已启用雄性 {enabledStats.male}</span>
        </div>
        <div className="breeding-planner__actions">
          <button type="button" onClick={() => handleSetAllEnabled(true)}>全选</button>
          <button type="button" onClick={() => handleSetAllEnabled(false)}>清空</button>
          <button type="button" className="breeding-planner__primary" onClick={handleBuildPlan}>{plannerCollapsed ? '重新生成' : '智能推荐配窝方案'}</button>
          <button
            type="button"
            className="breeding-planner__secondary"
            disabled={!result || Boolean(result.error) || placementLoading}
            onClick={handleGeneratePlacement}
          >
            {placementLoading ? '生成中...' : '生成位置图'}
          </button>
        </div>
      </div>

      {placementLoading && (
        <div className="breeding-planner__progress-bar">
          <div className="breeding-planner__progress-fill" style={{ width: `${placementProgress}%` }} />
          <span className="breeding-planner__progress-label">{placementProgress}%</span>
        </div>
      )}

      {!plannerCollapsed && (
        <div className="breeding-planner__selectors">
          <section className="breeding-planner__selector" aria-labelledby="breeding-planner-female-title">
            <h4 id="breeding-planner-female-title">雌性</h4>
            {femalePokemon.length > 0
              ? renderPokemonRows(
                femalePokemon,
                'female',
                config,
                countDrafts,
                handleUpdateEntry,
                handleCountChange,
                handleCountBlur,
                ownedKeys,
              )
              : <div className="breeding-planner__empty">暂无可参与的雌性精灵。</div>}
          </section>
          <section className="breeding-planner__selector" aria-labelledby="breeding-planner-male-title">
            <h4 id="breeding-planner-male-title">雄性</h4>
            {malePokemon.length > 0
              ? renderPokemonRows(
                malePokemon,
                'male',
                config,
                countDrafts,
                handleUpdateEntry,
                handleCountChange,
                handleCountBlur,
                ownedKeys,
              )
              : <div className="breeding-planner__empty">暂无可参与的雄性精灵。</div>}
          </section>
        </div>
      )}

      {result?.error && (
        <div className="breeding-planner__warning" role="alert">{result.error}</div>
      )}

      {result && !result.error && (
        <div className="breeding-planner__result">
          {result.uncoveredFemales.length > 0 && (
            <div className="breeding-planner__warning" role="alert">
              未覆盖雌性：{result.uncoveredFemales.map((entry) => entry.displayName).join('、')}
            </div>
          )}

          {result.placement ? (
            <div className="breeding-planner__result-main">
              <div className="breeding-planner__visual">
                <BreedingPlanGrid result={result} />
              </div>
              <div className="breeding-planner__coverage-sidebar">
                <section className="breeding-planner__coverage-card" aria-labelledby="breeding-planner-female-coverage-title">
                  <h4 id="breeding-planner-female-coverage-title">雌性覆盖明细</h4>
                  <div className="breeding-planner__summary-list">
                    {result.femaleCoverDetails.map((detail) => (
                      <div className="breeding-planner__coverage-row" key={detail.female.id}>
                        <span className="breeding-planner__coverage-male" title={detail.female.displayName}>
                          <img
                            className="breeding-planner__coverage-avatar breeding-planner__coverage-avatar--female"
                            src={toPublicAssetUrl(detail.female.avatarUrl || `/pets/head/${detail.female.baseId}.webp`)}
                            alt={detail.female.displayName}
                          />
                        </span>
                        <span className="breeding-planner__coverage-females">
                          {detail.coveredMales.length > 0
                            ? detail.coveredMales.map((male) => (
                              <span key={male.id} className="breeding-planner__coverage-covered-item">
                                <img
                                  className="breeding-planner__coverage-avatar breeding-planner__coverage-avatar--male"
                                  src={toPublicAssetUrl(male.avatarUrl || `/pets/head/${male.baseId}.webp`)}
                                  alt={male.displayName}
                                  title={male.displayName}
                                />
                              </span>
                            ))
                            : <span className="breeding-planner__coverage-uncovered">未覆盖</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
                <section className="breeding-planner__coverage-card" aria-labelledby="breeding-planner-male-coverage-title">
                  <h4 id="breeding-planner-male-coverage-title">雄性覆盖明细</h4>
                  <div className="breeding-planner__coverage-list">
                    {result.maleCoverDetails.map((detail) => (
                      <div className="breeding-planner__coverage-row" key={detail.male.id}>
                        <span className="breeding-planner__coverage-male" title={detail.male.displayName}>
                          <img
                            className="breeding-planner__coverage-avatar breeding-planner__coverage-avatar--male"
                            src={toPublicAssetUrl(detail.male.avatarUrl || `/pets/head/${detail.male.baseId}.webp`)}
                            alt={detail.male.displayName}
                          />
                        </span>
                        <span className="breeding-planner__coverage-females">
                          {detail.coveredFemales.length > 0
                            ? detail.coveredFemales.map((female) => (
                              <span key={female.id} className="breeding-planner__coverage-covered-item">
                                <img
                                  className="breeding-planner__coverage-avatar breeding-planner__coverage-avatar--female"
                                  src={toPublicAssetUrl(female.avatarUrl || `/pets/head/${female.baseId}.webp`)}
                                  alt={female.displayName}
                                  title={female.displayName}
                                />
                              </span>
                            ))
                            : <span className="breeding-planner__coverage-uncovered">未覆盖雌性</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="breeding-planner__empty-result">
              {result.uncoveredFemales.length === result.femaleInstances.length
                ? '所有雌性均无兼容雄性，无法生成位置图。'
                : placementAttempted
                  ? '本次没有生成位置图，可再次点击"生成位置图"重试。'
                  : '已生成配窝方案，可继续生成位置图。'}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default BreedingPlanner;
