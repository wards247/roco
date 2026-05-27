import type { Gender, Pokemon } from '../types';
import type { MyPokemon } from '../types';
import { hasPetGuideImage } from '../utils/petGuideImages';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

interface Props {
  pokemonList: Pokemon[];
  ownedPokemon?: Map<number, MyPokemon[]>;
  actionMode?: 'library' | 'manage';
  choosingGenderBaseId?: number | null;
  onMarkAsMine?: (pokemon: Pokemon) => void;
  onConfirmMarkAsMine?: (pokemon: Pokemon, genders: Gender[]) => void;
  onCancelMarkAsMine?: () => void;
  onOwnedGenderToggle?: (pokemon: Pokemon, gender: Gender, checked: boolean) => void;
  onOpenPokemon?: (baseId: number) => void;
  showActions?: boolean;
}

const PokemonGrid = ({
  pokemonList,
  ownedPokemon,
  actionMode,
  choosingGenderBaseId,
  onMarkAsMine,
  onConfirmMarkAsMine,
  onCancelMarkAsMine,
  onOwnedGenderToggle,
  onOpenPokemon,
  showActions,
}: Props) => {
  if (pokemonList.length === 0) {
    return <div className="pokemon-grid__empty">暂无精灵数据</div>;
  }

  return (
    <div className="pokemon-grid">
      {pokemonList.map((pokemon) => {
        const owned = ownedPokemon?.get(pokemon.base_id) || [];
        return (
          <PokemonCard
            key={pokemon.base_id}
            pokemon={pokemon}
            isOwned={owned.length > 0}
            hasGuideImage={hasPetGuideImage(pokemon.base_id)}
            ownedGenders={owned.map((ownedPokemon) => ownedPokemon.gender)}
            actionMode={actionMode}
            isChoosingGender={choosingGenderBaseId === pokemon.base_id}
            showActions={showActions}
            onMarkAsMine={() => onMarkAsMine?.(pokemon)}
            onConfirmMarkAsMine={(genders) => onConfirmMarkAsMine?.(pokemon, genders)}
            onCancelMarkAsMine={onCancelMarkAsMine}
            onOwnedGenderToggle={(gender, checked) => onOwnedGenderToggle?.(pokemon, gender, checked)}
            onOpenPokemon={onOpenPokemon ? () => onOpenPokemon(pokemon.base_id) : undefined}
          />
        );
      })}
    </div>
  );
};

export default PokemonGrid;
