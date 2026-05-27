import { useEggGroups } from '../hooks/useEggGroups';
import type { BreedingPair } from '../hooks/useBreeding';
import { getMyPokemonEggGroupIds } from '../utils/breedingCandidates';
import './CompatibilityList.css';

interface Props {
  title: string;
  recommendations: BreedingPair[];
  onOpenPokemon?: (baseId: number) => void;
}

const getPokemonName = (baseId: number, displayName?: string) => displayName || `精灵 #${baseId}`;

const getPokemonAvatar = (baseId: number, avatarUrl?: string) =>
  avatarUrl?.startsWith('/') ? avatarUrl : `/pets/head/${baseId}.webp`;

const CompatibilityList = ({ title, recommendations, onOpenPokemon }: Props) => {
  const { eggGroups } = useEggGroups();
  const eggGroupNameById = new Map(eggGroups.map((group) => [group.group_id, group.group_display]));
  const getEggGroupName = (eggGroupId: number) => eggGroupNameById.get(eggGroupId) || `蛋组 #${eggGroupId}`;
  const getEggGroupNames = (pokemon: BreedingPair['pokemon']) =>
    getMyPokemonEggGroupIds(pokemon).map(getEggGroupName).join('、');
  const targetGenderText = recommendations[0]?.direction === 'female-to-male' ? '雄性' : '雌性';

  if (recommendations.length === 0) {
    return (
      <section className="compatibility-list-card">
        <h4 className="compatibility-list-card__title">{title}</h4>
        <div className="compatibility-list__empty">暂无生蛋推荐。请先在“我的精灵”中添加精灵并设置性别。</div>
      </section>
    );
  }

  return (
    <section className="compatibility-list-card">
      <h4 className="compatibility-list-card__title">{title}</h4>
      <div className="compatibility-list">
        {recommendations.map(({ pokemon, compatiblePokemon, direction }) => {
          const itemTag = direction === 'female-to-male' ? '雌' : '雄';

          return (
            <article
              key={`${pokemon.base_id}-${pokemon.gender}`}
              className={`compatibility-list__item ${onOpenPokemon ? 'is-clickable' : ''}`}
              onClick={() => onOpenPokemon?.(pokemon.base_id)}
              role={onOpenPokemon ? 'link' : undefined}
              tabIndex={onOpenPokemon ? 0 : undefined}
              onKeyDown={(event) => {
                if (!onOpenPokemon || (event.key !== 'Enter' && event.key !== ' ')) {
                  return;
                }
                event.preventDefault();
                onOpenPokemon(pokemon.base_id);
              }}
            >
              <div className="compatibility-list__female">
                <img
                  src={getPokemonAvatar(pokemon.base_id, pokemon.avatar_url)}
                  alt={getPokemonName(pokemon.base_id, pokemon.display_name)}
                  className="compatibility-list__avatar-small"
                />
                <span className="compatibility-list__identity">
                  <span className="compatibility-list__name">
                    {getPokemonName(pokemon.base_id, pokemon.display_name)}
                  </span>
                  <span className="compatibility-list__subtitle">{getEggGroupNames(pokemon)}</span>
                </span>
                <span className={`compatibility-list__gender-tag gender-${pokemon.gender}`}>{itemTag}</span>
              </div>

              <div className="compatibility-list__count">
                和 <strong>{compatiblePokemon.length}</strong> 个{targetGenderText}兼容
              </div>

              {compatiblePokemon.length > 0 && (
                <div className="compatibility-list__males">
                  {compatiblePokemon.map((compatible) => (
                    <div
                      key={`${compatible.base_id}-${compatible.gender}`}
                      className="compatibility-list__male-chip"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenPokemon?.(compatible.base_id);
                      }}
                      role={onOpenPokemon ? 'link' : undefined}
                      tabIndex={onOpenPokemon ? 0 : undefined}
                      onKeyDown={(event) => {
                        if (!onOpenPokemon || (event.key !== 'Enter' && event.key !== ' ')) {
                          return;
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        onOpenPokemon(compatible.base_id);
                      }}
                    >
                      <img
                        src={getPokemonAvatar(compatible.base_id, compatible.avatar_url)}
                        alt={getPokemonName(compatible.base_id, compatible.display_name)}
                        className="compatibility-list__avatar-tiny"
                      />
                      <span className="compatibility-list__chip-text">
                        <span>{getPokemonName(compatible.base_id, compatible.display_name)}</span>
                        <small>{getEggGroupNames(compatible)}</small>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CompatibilityList;
