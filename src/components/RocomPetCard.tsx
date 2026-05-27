import type { KeyboardEvent } from 'react';
import type { RocomPetCard as RocomPetCardData } from '../types/rocom';
import './RocomPetCard.css';

interface Props {
  pet: RocomPetCardData;
  eggGroupNames: string[];
  onOpenPet?: (id: number) => void;
}

const RocomPetCard = ({ pet, eggGroupNames, onOpenPet }: Props) => {
  const isClickable = !!onOpenPet;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpenPet || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }

    event.preventDefault();
    onOpenPet(pet.id);
  };

  return (
    <article
      className={`rocom-pet-card ${isClickable ? 'is-clickable' : ''}`}
      onClick={() => onOpenPet?.(pet.id)}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'link' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `查看${pet.name}详情` : undefined}
    >
      <img src={pet.avatarUrl} alt={pet.name} className="rocom-pet-card__avatar" loading="lazy" />
      <div className="rocom-pet-card__info">
        <h3 className="rocom-pet-card__name">{pet.name}</h3>
        <p className="rocom-pet-card__meta">#{pet.id} · {pet.typeName || '未知属性'}</p>
        <p className="rocom-pet-card__groups">
          {eggGroupNames.length > 0 ? eggGroupNames.join('、') : '暂无蛋组'}
        </p>
      </div>
      <span className="rocom-pet-card__stat">{pet.totalStats}</span>
    </article>
  );
};

export default RocomPetCard;
