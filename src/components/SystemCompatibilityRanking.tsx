import { useState } from 'react';
import { useEggGroups } from '../hooks/useEggGroups';
import type { SystemBreedingRecommendation } from '../utils/breedingCandidates';
import './SystemCompatibilityRanking.css';

interface Props {
  recommendations: SystemBreedingRecommendation[];
  onOpenPokemon?: (baseId: number) => void;
}

const PAGE_SIZE = 10;
const PREVIEW_LIMIT = 10;

const SystemCompatibilityRanking = ({ recommendations, onOpenPokemon }: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { eggGroups } = useEggGroups();
  const eggGroupNameById = new Map(eggGroups.map((group) => [group.group_id, group.group_display]));
  const getEggGroupNames = (eggGroupIds: number[]) =>
    eggGroupIds.map((eggGroupId) => eggGroupNameById.get(eggGroupId) || `蛋组 #${eggGroupId}`).join('、');

  const totalPages = Math.max(1, Math.ceil(recommendations.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const ranking = recommendations.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  return (
    <aside className="system-ranking" aria-label="系统高兼容排行">
      <div className="system-ranking__header">
        <h3 className="system-ranking__title">系统高兼容排行</h3>
        <span className="system-ranking__meta">{recommendations.length} 个</span>
      </div>

      <div className="system-ranking__list">
        {ranking.map((recommendation, index) => {
          const previewPokemon = recommendation.compatiblePokemon.slice(0, PREVIEW_LIMIT);
          const hiddenCount = recommendation.compatiblePokemon.length - previewPokemon.length;

          return (
            <div
              key={recommendation.pokemon.family_key || recommendation.pokemon.base_id}
              className="system-ranking__item"
              onClick={() => onOpenPokemon?.(recommendation.pokemon.base_id)}
              role={onOpenPokemon ? 'link' : undefined}
              tabIndex={onOpenPokemon ? 0 : undefined}
              onKeyDown={(event) => {
                if (!onOpenPokemon || (event.key !== 'Enter' && event.key !== ' ')) {
                  return;
                }

                event.preventDefault();
                onOpenPokemon(recommendation.pokemon.base_id);
              }}
            >
              <span className="system-ranking__rank">{(activePage - 1) * PAGE_SIZE + index + 1}</span>
              <span className="system-ranking__main">
                <span className="system-ranking__name">{recommendation.pokemon.display_name}</span>
                <span className="system-ranking__groups">{getEggGroupNames(recommendation.eggGroupIds)}</span>
              </span>
              <span className="system-ranking__count">{recommendation.compatibilityCount}</span>

              <div className="system-ranking__tooltip" role="tooltip">
                <div className="system-ranking__tooltip-title">兼容详情</div>
                {previewPokemon.map((pokemon) => (
                  <div key={pokemon.family_key || pokemon.base_id} className="system-ranking__tooltip-row">
                    <span>{pokemon.display_name}</span>
                    <small>{pokemon.family_chain}</small>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div className="system-ranking__tooltip-more">还有 {hiddenCount} 个</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav className="system-ranking__pagination" aria-label="系统高兼容排行分页">
          <button
            type="button"
            className="system-ranking__page-button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={activePage === 1}
          >
            上一页
          </button>
          <span className="system-ranking__page-summary">
            {activePage} / {totalPages}
          </span>
          <button
            type="button"
            className="system-ranking__page-button"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={activePage === totalPages}
          >
            下一页
          </button>
        </nav>
      )}
    </aside>
  );
};

export default SystemCompatibilityRanking;
