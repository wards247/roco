import { useMemo, useState } from 'react';
import type { MyPokemon } from '../types';
import { useBreedingPlannerConfig } from '../hooks/useBreedingPlannerConfig';
import {
  buildBreedingPlan,
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
}

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

const renderPokemonRows = (
  entries: MyPokemon[],
  gender: PlannerGender,
  config: BreedingPlannerConfig,
  countDrafts: Partial<Record<PlannerPokemonKey, string>>,
  onUpdateEntry: UpdateEntryHandler,
  onCountChange: CountChangeHandler,
  onCountBlur: CountBlurHandler,
) => (
  <div className="breeding-planner__list" role="list">
    {entries.map((entry) => {
      const key = getPlannerPokemonKey(entry.base_id, gender);
      const itemConfig = config.entries[key] ?? { enabled: true, count: 1 };
      const countValue = countDrafts[key] ?? itemConfig.count;
      const name = getDisplayName(entry);

      return (
        <div className="breeding-planner__row" role="listitem" key={key}>
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
            src={entry.avatar_url || `/pets/head/${entry.base_id}.webp`}
            alt=""
            loading="lazy"
          />
          <div className="breeding-planner__info">
            <div className="breeding-planner__name" title={name}>{name}</div>
            <div className="breeding-planner__egg-groups">{formatEggGroups(entry)}</div>
          </div>
          <label className="breeding-planner__count">
            <span>数量</span>
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
  const cellSize = 60;
  const viewSize = placement.gridSize * cellSize;
  const getCenter = (coord: { x: number; y: number }) => ({
    x: coord.x * cellSize + cellSize / 2,
    y: coord.y * cellSize + cellSize / 2,
  });

  return (
    <svg
      className="breeding-planner__grid"
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      role="img"
      aria-label="配对网格"
    >
      {Array.from({ length: placement.gridSize * placement.gridSize }, (_, index) => {
        const x = index % placement.gridSize;
        const y = Math.floor(index / placement.gridSize);

        return (
          <rect
            key={`cell-${x}-${y}`}
            className="breeding-planner__grid-cell"
            x={x * cellSize + 4}
            y={y * cellSize + 4}
            width={cellSize - 8}
            height={cellSize - 8}
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
            className={line.locked ? 'breeding-planner__line breeding-planner__line--locked' : 'breeding-planner__line'}
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
              x={center.x - 22}
              y={center.y - 18}
              width={44}
              height={36}
              rx={8}
            />
            <text x={center.x} y={center.y - 2} textAnchor="middle">
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
              x={center.x - 22}
              y={center.y - 18}
              width={44}
              height={36}
              rx={8}
            />
            <text x={center.x} y={center.y - 2} textAnchor="middle">
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

const BreedingPlanner = ({ pokemon }: BreedingPlannerProps) => {
  const plannerPokemon = useMemo(
    () => pokemon.filter((entry) => entry.can_hatch !== false && (entry.gender === 'male' || entry.gender === 'female')),
    [pokemon],
  );
  const femalePokemon = useMemo(
    () => plannerPokemon.filter((entry) => entry.gender === 'female'),
    [plannerPokemon],
  );
  const malePokemon = useMemo(
    () => plannerPokemon.filter((entry) => entry.gender === 'male'),
    [plannerPokemon],
  );
  const { config, updateNestCount, updateEntry, setAllEnabled } = useBreedingPlannerConfig(plannerPokemon);
  const [result, setResult] = useState<BreedingPlanResult | null>(null);
  const [nestCountDraft, setNestCountDraft] = useState<string | null>(null);
  const [countDrafts, setCountDrafts] = useState<Partial<Record<PlannerPokemonKey, string>>>({});

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
    setResult(buildBreedingPlan({ pokemon: plannerPokemon, config }));
  };

  const handleNestCountChange = (rawValue: string) => {
    setResult(null);
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
    setResult(null);
    updateEntry(baseId, gender, patch);
  };

  const handleCountChange: CountChangeHandler = (baseId, gender, rawValue) => {
    const key = getPlannerPokemonKey(baseId, gender);

    setResult(null);
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
    setResult(null);
    setAllEnabled(enabled, plannerPokemon);
  };

  return (
    <section className="breeding-planner" aria-labelledby="breeding-planner-title">
      <div className="breeding-planner__header">
        <div>
          <h3 className="breeding-planner__title" id="breeding-planner-title">配窝助手</h3>
          <p className="breeding-planner__desc">选择参与配窝的精灵和数量，生成 7x7 窝位摆放参考。</p>
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
          <button type="button" className="breeding-planner__primary" onClick={handleBuildPlan}>生成方案</button>
        </div>
      </div>

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
            )
            : <div className="breeding-planner__empty">暂无可参与的雄性精灵。</div>}
        </section>
      </div>

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

          <div className="breeding-planner__result-main">
            <div className="breeding-planner__visual">
              <BreedingPlanGrid result={result} />
            </div>
            <section className="breeding-planner__pair-stats" aria-labelledby="breeding-planner-pair-stats-title">
              <h4 id="breeding-planner-pair-stats-title">雌性配对次数</h4>
              <div className="breeding-planner__summary-list">
                {result.femalePairStats.map((stat) => (
                  <div className="breeding-planner__summary-row" key={stat.female.id}>
                    <span title={stat.female.displayName}>{stat.female.displayName}</span>
                    <strong>{stat.pairCount}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="breeding-planner__coverage" aria-labelledby="breeding-planner-coverage-title">
            <h4 id="breeding-planner-coverage-title">雄性覆盖明细</h4>
            <div className="breeding-planner__coverage-list">
              {result.maleCoverDetails.map((detail) => (
                <div className="breeding-planner__coverage-row" key={detail.male.id}>
                  <span className="breeding-planner__coverage-male" title={detail.male.displayName}>
                    {detail.male.displayName}
                  </span>
                  <span className="breeding-planner__coverage-females">
                    {detail.coveredFemales.length > 0
                      ? detail.coveredFemales.map((female) => female.displayName).join('、')
                      : '未覆盖雌性'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default BreedingPlanner;
