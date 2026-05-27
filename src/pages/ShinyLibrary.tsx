import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEggGroups } from '../hooks/useEggGroups';
import { useMyPokemon } from '../hooks/useMyPokemon';
import { getVisibleOwnedGendersForBaseIds, hasVisibleOwnedGenderForBaseIds } from '../utils/ownedGenders';
import { shinyPetSeasons, shinyPets, type ShinyPet } from '../utils/shinyPets';
import './ShinyLibrary.css';

const ShinyLibrary = () => {
  const navigate = useNavigate();
  const { myPokemon } = useMyPokemon();
  const { allPokemon } = useEggGroups();
  const relatedBaseIdsByShinyPetId = useMemo(
    () =>
      new Map(
        shinyPets.map((pet) => [
          pet.id,
          [
            pet.id,
            ...allPokemon
              .filter((pokemon) => pokemon.base_id === pet.id || pokemon.family_chain.includes(pet.displayName))
              .map((pokemon) => pokemon.base_id),
          ],
        ]),
    ),
    [allPokemon],
  );
  const getSortedShinyPets = (seasonPets: ShinyPet[]) =>
    seasonPets
        .map((pet, index) => ({
          pet,
          index,
          isOwned: hasVisibleOwnedGenderForBaseIds(myPokemon, relatedBaseIdsByShinyPetId.get(pet.id) ?? [pet.id]),
        }))
        .sort((left, right) => {
          if (left.isOwned !== right.isOwned) {
            return left.isOwned ? 1 : -1;
          }

          return left.index - right.index;
        })
        .map(({ pet }) => pet);

  return (
    <div className="shiny-library">
      <h2 className="page-title">异色</h2>
      <div className="shiny-library__summary">
        收录 S2 赛季 {shinyPetSeasons[0].pets.length} 个、S1 赛季 {shinyPetSeasons[1].pets.length} 个异色精灵
      </div>

      <div className="shiny-library__seasons">
        {shinyPetSeasons.map((season) => (
          <section key={season.season} className="shiny-library__season">
            <div className="shiny-library__season-header">
              <h3>{season.label}</h3>
              <span>{season.pets.length} 个</span>
            </div>
            <div className="shiny-library__grid">
              {getSortedShinyPets(season.pets).map((pet) => {
                const ownedGenders = getVisibleOwnedGendersForBaseIds(
                  myPokemon,
                  relatedBaseIdsByShinyPetId.get(pet.id) ?? [pet.id],
                );

                return (
                  <button
                    key={pet.id}
                    type="button"
                    className="shiny-card"
                    onClick={() => navigate(`/pokemon/${pet.id}`)}
                  >
                    <div className="shiny-card__pets">
                      {pet.hasNormalImage ? (
                        <img src={pet.normalImageUrl} alt={pet.displayName} className="shiny-card__pet" loading="lazy" />
                      ) : (
                        <span className="shiny-card__pet-placeholder">暂无原图</span>
                      )}
                      {pet.hasShinyImage ? (
                        <img
                          src={pet.shinyImageUrl}
                          alt={`${pet.displayName}异色`}
                          className="shiny-card__pet"
                          loading="lazy"
                        />
                      ) : (
                        <span className="shiny-card__pet-placeholder">暂无异色图</span>
                      )}
                    </div>
                    <div className="shiny-card__body">
                      <h3>
                        <span>{pet.displayName}</span>
                        {ownedGenders.length > 0 && (
                          <span className="shiny-card__owned-genders" aria-label="已拥有性别">
                            {ownedGenders.map((ownedGender) => (
                              <span key={ownedGender} className={`shiny-card__owned-gender gender-${ownedGender}`}>
                                {ownedGender === 'male' ? '♂' : '♀'}
                              </span>
                            ))}
                          </span>
                        )}
                      </h3>
                      {!pet.hasShinyImage && <span className="shiny-card__warning">暂无异色详情图</span>}
                      {!pet.hasEggImages ? (
                        <span className="shiny-card__warning">暂无蛋图</span>
                      ) : (
                        <div className="shiny-card__eggs">
                          <span>
                            <img src={pet.normalEggUrl} alt={`${pet.displayName}原色蛋`} loading="lazy" />
                            原色蛋
                          </span>
                          <span>
                            <img src={pet.shinyEggUrl} alt={`${pet.displayName}异色蛋`} loading="lazy" />
                            异色蛋
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ShinyLibrary;
