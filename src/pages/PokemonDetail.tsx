import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEggGroups } from '../hooks/useEggGroups';
import { useRocomPetDetail } from '../hooks/useRocomPetDetail';
import { useRocomPets } from '../hooks/useRocomPets';
import {
  getLocalBreedingCandidates,
  getPokemonEggGroupIds,
} from '../utils/breedingCandidates';
import {
  getRocomDuplicateKey,
  getRocomFriendImageUrl,
  getRocomTypeName,
  hasRocomStats,
  toRocomPetCard,
} from '../utils/rocomPets';
import { getPetGuideImageById } from '../utils/petGuideImages';
import { getShinyPetById } from '../utils/shinyPets';
import type { EggGroup, Pokemon } from '../types';
import type { RocomEvolutionNode, RocomEvolutionStage } from '../types/rocom';
import './PokemonDetail.css';

interface DetailCandidate {
  id: number;
  name: string;
  avatarUrl: string;
  subtitle: string;
  sharedEggGroupIds: number[];
}

const PokemonDetail = () => {
  const { baseId } = useParams();
  const { allPokemon, eggGroups } = useEggGroups();
  const { petCards: rocomPetCards, petById } = useRocomPets();
  const parsedBaseId = Number(baseId);
  const isValidBaseId = Number.isFinite(parsedBaseId);
  const { detail: rocomDetail } = useRocomPetDetail(isValidBaseId ? parsedBaseId : null);
  const shinyPet = isValidBaseId ? getShinyPetById(parsedBaseId) : null;
  const guideImage = isValidBaseId ? getPetGuideImageById(parsedBaseId) : null;

  const localEntries = useMemo(
    () => allPokemon.filter((pokemon) => pokemon.base_id === parsedBaseId),
    [allPokemon, parsedBaseId],
  );

  const primaryPokemon: Pokemon | undefined = localEntries[0];

  const localEggGroups = useMemo(() => {
    const groupIds = new Set(getPokemonEggGroupIds(localEntries));
    return eggGroups.filter((group) => groupIds.has(group.group_id));
  }, [eggGroups, localEntries]);

  const eggGroupNameById = useMemo(
    () => new Map(eggGroups.map((group) => [group.group_id, group.group_display])),
    [eggGroups],
  );

  const localCandidates = useMemo(
    () => getLocalBreedingCandidates(allPokemon, parsedBaseId),
    [allPokemon, parsedBaseId],
  );

  const displayName = primaryPokemon?.display_name || rocomDetail?.localized.zh.name || `精灵 #${parsedBaseId}`;
  const familyChain = primaryPokemon?.family_chain || '';
  const typeName = primaryPokemon?.type_name || (rocomDetail ? getRocomTypeName(rocomDetail) : '');
  const className = primaryPokemon?.class_name || rocomDetail?.world_profile?.classis_name || '';
  const hatchStatus = primaryPokemon?.hatch_status_text || (rocomDetail?.breeding_profile?.egg_groups.length ? '可生蛋' : '');
  const avatarUrl = primaryPokemon?.avatar_url || `/pets/head/${parsedBaseId}.webp`;
  const bodyUrl = rocomDetail ? getRocomFriendImageUrl(rocomDetail.name) : primaryPokemon?.body_url || avatarUrl;
  const rocomEggGroupIds = rocomDetail?.breeding_profile?.egg_groups ?? [];
  const sourceEggGroupIds = localEntries.length > 0 ? getPokemonEggGroupIds(localEntries) : rocomEggGroupIds;
  const evolutionPetIds = useMemo(
    () =>
      new Set(
        rocomDetail?.evolution_tree.stages.flatMap((stage) => stage.monsters.map((monster) => monster.id)) ?? [],
      ),
    [rocomDetail],
  );
  const rocomCandidates = useMemo<DetailCandidate[]>(() => {
    if (localEntries.length > 0 || sourceEggGroupIds.length === 0) {
      return [];
    }

    const sourceEggGroupSet = new Set(sourceEggGroupIds);

    return rocomPetCards.flatMap((pet): DetailCandidate[] => {
      if (pet.id === parsedBaseId || evolutionPetIds.has(pet.id)) {
        return [];
      }

      const sharedEggGroupIds = pet.eggGroupIds.filter((groupId) => sourceEggGroupSet.has(groupId));
      if (sharedEggGroupIds.length === 0) {
        return [];
      }

      return [{
        id: pet.id,
        name: pet.name,
        avatarUrl: pet.avatarUrl,
        subtitle: pet.eggGroupIds.map((groupId) => eggGroupNameById.get(groupId) || `蛋组 #${groupId}`).join('、'),
        sharedEggGroupIds,
      }];
    });
  }, [eggGroupNameById, evolutionPetIds, localEntries.length, parsedBaseId, rocomPetCards, sourceEggGroupIds]);
  const detailCandidates = useMemo<DetailCandidate[]>(
    () =>
      localEntries.length > 0
        ? localCandidates.map(({ pokemon, sharedEggGroupIds }) => ({
            id: pokemon.base_id,
            name: pokemon.display_name,
            avatarUrl: pokemon.avatar_url,
            subtitle: pokemon.family_chain,
            sharedEggGroupIds,
          }))
        : rocomCandidates,
    [localCandidates, localEntries.length, rocomCandidates],
  );
  const eggGroupNames =
    (localEggGroups.length > 0
      ? localEggGroups.map((group) => group.group_display)
      : rocomEggGroupIds.map((groupId) => eggGroupNameById.get(groupId) || `蛋组 #${groupId}`))
      .join('、') || '暂无蛋组数据';
  const statRows = rocomDetail
    ? [
        ['生命', rocomDetail.base_hp],
        ['物攻', rocomDetail.base_phy_atk],
        ['魔攻', rocomDetail.base_mag_atk],
        ['物防', rocomDetail.base_phy_def],
        ['魔防', rocomDetail.base_mag_def],
        ['速度', rocomDetail.base_spd],
      ]
    : [];
  const totalStats = statRows.reduce((sum, [, value]) => sum + Number(value), 0);

  if (!isValidBaseId) {
    return (
      <div className="pokemon-detail">
        <Link to="/" className="detail-back">
          返回精灵库
        </Link>
        <div className="detail-empty">无效的精灵编号。</div>
      </div>
    );
  }

  const renderEggGroupCard = (group: EggGroup) => (
    <div key={group.group_id} className="detail-egg-group">
      <div className="detail-egg-group__name">{group.group_display}</div>
      <div className="detail-egg-group__meta">
        可生蛋 {group.hatchable_member_count} / 总计 {group.member_count}
      </div>
    </div>
  );

  const getVisibleEvolutionMonsters = (stage: RocomEvolutionStage) => {
    const hasNonZeroStatsByKey = new Set(
      stage.monsters
        .map((monster) => petById.get(monster.id))
        .filter((pet): pet is NonNullable<typeof pet> => !!pet && hasRocomStats(pet))
        .map(getRocomDuplicateKey),
    );

    return stage.monsters.filter((monster) => {
      const pet = petById.get(monster.id);
      if (!pet) {
        return true;
      }

      return hasRocomStats(pet) || !hasNonZeroStatsByKey.has(getRocomDuplicateKey(pet));
    });
  };

  const getEvolutionMonsterName = (monster: RocomEvolutionNode) => {
    const pet = petById.get(monster.id);
    return pet ? toRocomPetCard(pet).name : monster.localized.zh.name;
  };

  const renderEvolutionStage = (stage: RocomEvolutionStage) => (
    <div key={stage.depth} className="detail-evolution-stage">
      <div className="detail-evolution-stage__depth">阶段 {stage.depth}</div>
      <div className="detail-evolution-stage__monsters">
        {getVisibleEvolutionMonsters(stage).map((monster) => (
          <Link key={monster.id} to={`/pokemon/${monster.id}`} className="detail-evolution-monster">
            <img
              src={getRocomFriendImageUrl(monster.name)}
              alt={getEvolutionMonsterName(monster)}
              className="detail-evolution-monster__image"
              loading="lazy"
            />
            <span>{getEvolutionMonsterName(monster)}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pokemon-detail">
      <Link to="/" className="detail-back">
        返回精灵库
      </Link>

      <section className="detail-hero">
        <div className="detail-media">
          {shinyPet ? (
            <div className="detail-forms">
              <figure className="detail-form">
                {shinyPet.hasNormalImage ? (
                  <img src={bodyUrl || avatarUrl} alt={displayName} className="detail-body" />
                ) : (
                  <span className="detail-body detail-body--placeholder">暂无原图</span>
                )}
                <figcaption>原形象</figcaption>
              </figure>
              <figure className="detail-form">
                {shinyPet.hasShinyImage ? (
                  <img src={shinyPet.shinyImageUrl} alt={`${displayName}异色`} className="detail-body" />
                ) : (
                  <span className="detail-body detail-body--placeholder">暂无异色图</span>
                )}
                <figcaption>{shinyPet.hasShinyImage ? '异色形象' : '暂无异色详情图'}</figcaption>
              </figure>
            </div>
          ) : (
            <img src={bodyUrl || avatarUrl} alt={displayName} className="detail-body" />
          )}
          <img src={avatarUrl} alt={`${displayName}头像`} className="detail-avatar" />
        </div>

        <div className="detail-summary">
          <h2 className="detail-title">{displayName}</h2>
          {(familyChain || rocomDetail?.species.localized.zh) && (
            <div className="detail-subtitle">{familyChain || rocomDetail?.species.localized.zh}</div>
          )}
          <div className="detail-tags">
            {typeName && <span>{typeName}</span>}
            {className && <span>{className}</span>}
            {hatchStatus && <span>{hatchStatus}</span>}
          </div>
          <dl className="detail-facts">
            <div>
              <dt>蛋组</dt>
              <dd>{eggGroupNames}</dd>
            </div>
            <div>
              <dt>生蛋候选</dt>
              <dd>{detailCandidates.length} 个</dd>
            </div>
          </dl>

          {shinyPet?.hasEggImages && (
            <div className="detail-shiny-eggs" aria-label={`${displayName}蛋图`}>
              <div className="detail-shiny-egg">
                <img src={shinyPet.normalEggUrl} alt={`${displayName}原色蛋`} loading="lazy" />
                <span>原色蛋</span>
              </div>
              <div className="detail-shiny-egg">
                <img src={shinyPet.shinyEggUrl} alt={`${displayName}异色蛋`} loading="lazy" />
                <span>异色蛋</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {guideImage && (
        <section className="detail-section">
          <div className="detail-section__header">
            <h3>一图流攻略</h3>
            <a href={guideImage.sourceUrl} target="_blank" rel="noreferrer">
              TapTap 原帖
            </a>
          </div>
          <figure className="detail-guide">
            <div className="detail-guide__image-frame">
              <img
                src={guideImage.imageUrl}
                alt={`${displayName}一图流攻略`}
                loading="lazy"
              />
            </div>
            <figcaption>
              {guideImage.sourceName === guideImage.displayName
                ? `${guideImage.displayName} · ${guideImage.articleTitle}`
                : `${guideImage.sourceName}（匹配 ${guideImage.displayName}） · ${guideImage.articleTitle}`}
            </figcaption>
          </figure>
        </section>
      )}

      {rocomDetail && (
        <section className="detail-section">
          <h3>种族值</h3>
          <div className="detail-stats">
            {statRows.map(([label, value]) => (
              <div key={label} className="detail-stat">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            <div className="detail-stat detail-stat--total">
              <span>总和</span>
              <strong>{totalStats}</strong>
            </div>
          </div>
        </section>
      )}

      {rocomDetail?.world_profile && (
        <section className="detail-section">
          <h3>图鉴信息</h3>
          <div className="detail-profile">
            <p>{rocomDetail.world_profile.introduction || '暂无图鉴介绍。'}</p>
            <dl>
              <div>
                <dt>栖息地</dt>
                <dd>{rocomDetail.world_profile.description_habitat || '暂无数据'}</dd>
              </div>
              <div>
                <dt>移动方式</dt>
                <dd>{rocomDetail.world_profile.movement_type || '暂无数据'}</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {rocomDetail?.evolution_tree.stages.length ? (
        <section className="detail-section">
          <h3>进化路线</h3>
          <div className="detail-evolution">
            {rocomDetail.evolution_tree.stages.map(renderEvolutionStage)}
          </div>
        </section>
      ) : null}

      <section className="detail-section">
        <h3>所属蛋组</h3>
        <div className="detail-egg-groups">
          {localEggGroups.length > 0 ? (
            localEggGroups.map(renderEggGroupCard)
          ) : rocomEggGroupIds.length > 0 ? (
            rocomEggGroupIds.map((groupId) => (
              <div key={groupId} className="detail-egg-group">
                <div className="detail-egg-group__name">
                  {eggGroupNameById.get(groupId) || `蛋组 #${groupId}`}
                </div>
                <div className="detail-egg-group__meta">来自完整精灵库</div>
              </div>
            ))
          ) : (
            <div className="detail-empty">暂无蛋组数据</div>
          )}
        </div>
      </section>

      <section className="detail-section">
        <h3>生蛋候选列表</h3>
        {detailCandidates.length === 0 ? (
          <div className="detail-empty">暂无候选数据。</div>
        ) : (
          <div className="candidate-list">
            {detailCandidates.map((candidate) => (
              <Link
                key={candidate.id}
                to={`/pokemon/${candidate.id}`}
                className="candidate-item"
              >
                <img
                  src={candidate.avatarUrl}
                  alt={candidate.name}
                  className="candidate-item__avatar"
                  loading="lazy"
                />
                <span className="candidate-item__name">{candidate.name}</span>
                <span className="candidate-item__page">
                  {candidate.subtitle}
                  {' · '}
                  共享蛋组：
                  {candidate.sharedEggGroupIds
                    .map((groupId) => eggGroupNameById.get(groupId) || `蛋组 #${groupId}`)
                    .join('、')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default PokemonDetail;
