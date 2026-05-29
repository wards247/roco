import CompatibilityList from '../components/CompatibilityList';
import BreedingPlanner from '../components/BreedingPlanner';
import SystemCompatibilityRanking from '../components/SystemCompatibilityRanking';
import { useBreeding } from '../hooks/useBreeding';
import { useEggGroups } from '../hooks/useEggGroups';
import { useMyPokemon } from '../hooks/useMyPokemon';
import { useNavigate } from 'react-router-dom';
import './Breeding.css';
import { useMemo } from 'react';
import { getSystemBreedingRecommendations } from '../utils/breedingCandidates';

const Breeding = () => {
  const navigate = useNavigate();
  const { myPokemon } = useMyPokemon();
  const { allPokemon } = useEggGroups();
  const enrichedMyPokemon = useMemo(
    () =>
      myPokemon.map((pokemon) => ({
        ...pokemon,
        egg_group_ids: [
          ...new Set(
            allPokemon
              .filter((entry) => entry.base_id === pokemon.base_id)
              .map((entry) => entry.egg_group_id),
          ),
        ],
        can_hatch: allPokemon.some(
          (entry) => entry.base_id === pokemon.base_id && entry.hatch_status_text === '可生蛋',
        ),
      })),
    [allPokemon, myPokemon],
  );
  const { femaleRecommendations, maleRecommendations, stats } = useBreeding(enrichedMyPokemon);
  const systemRecommendations = useMemo(
    () => getSystemBreedingRecommendations(allPokemon),
    [allPokemon],
  );

  return (
    <div className="breeding">
      <h2 className="page-title">生蛋推荐</h2>

      <div className="stats">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">我的精灵</span>
        </div>
        <div className="stat-item stat-item--male">
          <span className="stat-value">{stats.maleCount}</span>
          <span className="stat-label">雄性</span>
        </div>
        <div className="stat-item stat-item--female">
          <span className="stat-value">{stats.femaleCount}</span>
          <span className="stat-label">雌性</span>
        </div>
      </div>

      <BreedingPlanner pokemon={enrichedMyPokemon} />

      <div className="breeding-layout">
        <section className="recommendations-section">
          <h3 className="section-title">兼容性排名</h3>
          <p className="section-desc">按可配对数量降序排列</p>
          <div className="compatibility-sections">
            <CompatibilityList
              title="雌性兼容"
              recommendations={femaleRecommendations}
              onOpenPokemon={(baseId) => navigate(`/pokemon/${baseId}`)}
            />
            <CompatibilityList
              title="雄性兼容"
              recommendations={maleRecommendations}
              onOpenPokemon={(baseId) => navigate(`/pokemon/${baseId}`)}
            />
          </div>
        </section>

        <SystemCompatibilityRanking
          recommendations={systemRecommendations}
          onOpenPokemon={(baseId) => navigate(`/pokemon/${baseId}`)}
        />
      </div>
    </div>
  );
};

export default Breeding;
