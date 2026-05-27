import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { Gender, Pokemon } from '../types';
import './PokemonCard.css';

type GenderChoice = 'male' | 'female' | 'both';

interface Props {
  pokemon: Pokemon;
  isOwned?: boolean;
  hasGuideImage?: boolean;
  ownedGenders?: Gender[];
  actionMode?: 'library' | 'manage';
  isChoosingGender?: boolean;
  onMarkAsMine?: (pokemon: Pokemon) => void;
  onConfirmMarkAsMine?: (genders: Gender[]) => void;
  onCancelMarkAsMine?: () => void;
  onOwnedGenderToggle?: (gender: Gender, checked: boolean) => void;
  onOpenPokemon?: () => void;
  showActions?: boolean;
}

const PokemonCard = ({
  pokemon,
  isOwned,
  hasGuideImage,
  ownedGenders = [],
  actionMode = 'manage',
  isChoosingGender,
  showActions,
  onMarkAsMine,
  onConfirmMarkAsMine,
  onCancelMarkAsMine,
  onOwnedGenderToggle,
  onOpenPokemon,
}: Props) => {
  const [pendingGenderChoice, setPendingGenderChoice] = useState<GenderChoice>('female');
  const canHatch = pokemon.hatch_status_text === '可生蛋';
  const isLibraryMode = actionMode === 'library';
  const isClickable = !!onOpenPokemon;
  const stopActionClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (!onOpenPokemon) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenPokemon();
    }
  };

  const getPendingGenders = (choice: GenderChoice): Gender[] => {
    if (choice === 'both') {
      return ['male', 'female'];
    }

    return [choice];
  };

  const visibleOwnedGenders = ownedGenders.filter((gender) => gender !== 'unknown');

  return (
    <a
      href={`/pokemon/${pokemon.base_id}`}
      className={`pokemon-card ${!canHatch ? 'cannot-hatch' : ''} ${isClickable ? 'is-clickable' : ''}`}
      onClick={(e) => {
        if (onOpenPokemon) {
          e.preventDefault();
          onOpenPokemon();
        }
      }}
      onKeyDown={handleCardKeyDown}
      role={isClickable ? 'link' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `查看${pokemon.display_name}详情` : undefined}
    >
      <img
        src={pokemon.avatar_url}
        alt={pokemon.display_name}
        className="pokemon-card__avatar"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.visibility = 'hidden';
        }}
      />
      <div className="pokemon-card__info">
        <h3 className="pokemon-card__name">
          <span>{pokemon.display_name}</span>
          {hasGuideImage && (
            <span
              className="pokemon-card__guide-icon"
              aria-label="有一图流攻略"
              title="有一图流攻略"
            />
          )}
          {!isLibraryMode && visibleOwnedGenders.length > 0 && (
            <span className="pokemon-card__name-genders" aria-label="已拥有性别">
              {visibleOwnedGenders.map((ownedGender) => (
                <span key={ownedGender} className={`pokemon-card__name-gender gender-${ownedGender}`}>
                  {ownedGender === 'male' ? '♂' : '♀'}
                </span>
              ))}
            </span>
          )}
        </h3>
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
              {isLibraryMode && (
                <span className="pokemon-card__owned">
                  我的精灵
                </span>
              )}
              {isLibraryMode && ownedGenders.length > 0 && (
                <span className="pokemon-card__owned-genders">
                  {ownedGenders.map((ownedGender) => (
                    <span key={ownedGender} className={`pokemon-card__owned-gender gender-${ownedGender}`}>
                      {ownedGender === 'male' ? '♂' : ownedGender === 'female' ? '♀' : '?'}
                    </span>
                  ))}
                </span>
              )}
              {!isLibraryMode && (
                <div className="pokemon-card__gender-checks" onClick={stopActionClick}>
                  {[
                    ['male', '雄性'],
                    ['female', '雌性'],
                  ].map(([value, label]) => (
                    <label key={value} className="pokemon-card__gender-check">
                      <input
                        type="checkbox"
                        checked={ownedGenders.includes(value as Gender)}
                        onChange={(event) => onOwnedGenderToggle?.(value as Gender, event.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : isChoosingGender ? (
            <div className="pokemon-card__choose-gender">
              <div className="pokemon-card__gender-checks" onClick={stopActionClick}>
                {[
                  ['male', '雄性'],
                  ['female', '雌性'],
                  ['both', '雄雌都有'],
                ].map(([value, label]) => (
                  <label key={value} className="pokemon-card__gender-check">
                    <input
                      type="radio"
                      name={`gender-choice-${pokemon.base_id}`}
                      checked={pendingGenderChoice === value}
                      onChange={() => setPendingGenderChoice(value as GenderChoice)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={(event) => {
                  stopActionClick(event);
                  onConfirmMarkAsMine?.(getPendingGenders(pendingGenderChoice));
                }}
                className="pokemon-card__confirm-btn"
              >
                确定
              </button>
              <button
                type="button"
                onClick={(event) => {
                  stopActionClick(event);
                  onCancelMarkAsMine?.();
                }}
                className="pokemon-card__remove-btn"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                stopActionClick(event);
                onMarkAsMine?.(pokemon);
              }}
              className="pokemon-card__mark-btn"
            >
              标记为我的
            </button>
          )}
        </div>
      )}
    </a>
  );
};

export default PokemonCard;
