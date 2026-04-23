import { Pokemon } from '../types';
import './PokemonCard.css';

interface Props {
  pokemon: Pokemon;
  isOwned?: boolean;
  gender?: 'male' | 'female' | 'unknown';
  onMarkAsMine?: (pokemon: Pokemon) => void;
  onGenderChange?: (gender: 'male' | 'female' | 'unknown') => void;
  showActions?: boolean;
}

const PokemonCard = ({ pokemon, isOwned, gender, showActions, onMarkAsMine, onGenderChange }: Props) => {
  const canHatch = pokemon.hatch_status_text === '可生蛋';

  return (
    <div className={`pokemon-card ${!canHatch ? 'cannot-hatch' : ''}`}>
      <img
        src={pokemon.avatar_url}
        alt={pokemon.display_name}
        className="pokemon-card__avatar"
        loading="lazy"
      />
      <div className="pokemon-card__info">
        <h3 className="pokemon-card__name">{pokemon.display_name}</h3>
        <p className="pokemon-card__type">{pokemon.type_name}</p>
        <p className={`pokemon-card__status ${canHatch ? 'can-hatch' : 'cannot-hatch'}`}>
          {pokemon.hatch_status_text}
        </p>
        {pokemon.family_chain && (
          <p className="pokemon-card__family">{pokemon.family_chain}</p>
        )}
      </div>
      {showActions && (
        <div className="pokemon-card__actions">
          {isOwned ? (
            <>
              <span className="pokemon-card__owned">我的精灵</span>
              {gender && (
                <span className={`pokemon-card__gender gender-${gender}`}>
                  {gender === 'male' ? '雄' : gender === 'female' ? '雌' : '未知'}
                </span>
              )}
              <select
                value={gender ?? 'unknown'}
                onChange={(e) => onGenderChange?.(e.target.value as 'male' | 'female' | 'unknown')}
                className="pokemon-card__gender-select"
                aria-label="选择性别"
              >
                <option value="unknown">未知</option>
                <option value="male">雄性</option>
                <option value="female">雌性</option>
              </select>
            </>
          ) : (
            <button onClick={() => onMarkAsMine?.(pokemon)} className="pokemon-card__mark-btn">
              标记为我的
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PokemonCard;
