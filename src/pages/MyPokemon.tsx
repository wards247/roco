import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EggGroupSelector from '../components/EggGroupSelector';
import PokemonGrid from '../components/PokemonGrid';
import SearchBar from '../components/SearchBar';
import { useEggGroups } from '../hooks/useEggGroups';
import { useMyPokemon } from '../hooks/useMyPokemon';
import type { Gender, Pokemon } from '../types';
import { toPublicAssetUrl } from '../utils/publicAssets';
import './MyPokemon.css';

type GenderFilter = Gender | 'all';

const MyPokemon = () => {
  const navigate = useNavigate();
  const { myPokemon, addPokemonWithGenders, removePokemon } = useMyPokemon();
  const { allPokemon, eggGroups } = useEggGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

  const pokemonByBaseId = useMemo(
    () => new Map(allPokemon.map((pokemon) => [pokemon.base_id, pokemon])),
    [allPokemon],
  );

  const toPokemonCardData = (pokemon: (typeof myPokemon)[number]): Pokemon => {
    const source = pokemonByBaseId.get(pokemon.base_id);

    return {
      base_id: pokemon.base_id,
      display_name: source?.display_name || pokemon.display_name || `精灵 #${pokemon.base_id}`,
      page_name: source?.page_name || pokemon.display_name || '',
      avatar_url: source?.avatar_url || toPublicAssetUrl(`/pets/head/${pokemon.base_id}.webp`),
      body_url: source?.body_url || '',
      class_name: source?.class_name || '',
      type_name: source?.type_name || '',
      hatch_status_text: source?.hatch_status_text || '',
      family_chain: source?.family_chain || '',
      family_key: source?.family_key || '',
      member_count: source?.member_count || 0,
      can_hatch_member_count: source?.can_hatch_member_count || 0,
      egg_group_id: pokemon.egg_group_id,
    };
  };

  const groupedMyPokemon = useMemo(() => {
    const grouped = new Map<number, typeof myPokemon>();
    myPokemon.forEach((pokemon) => {
      const eggGroupIds = [
        ...new Set(
          allPokemon
            .filter((entry) => entry.base_id === pokemon.base_id)
            .map((entry) => entry.egg_group_id),
        ),
      ];
      grouped.set(pokemon.base_id, [
        ...(grouped.get(pokemon.base_id) || []),
        {
          ...pokemon,
          egg_group_ids: eggGroupIds.length > 0 ? eggGroupIds : pokemon.egg_group_ids,
        },
      ]);
    });
    return [...grouped.values()].map((group) => group[0]);
  }, [allPokemon, myPokemon]);

  const filteredPokemon = useMemo(() => {
    let result = groupedMyPokemon;

    if (selectedGroupId) {
      result = result.filter((pokemon) => {
        const ownedEntries = myPokemon.filter((owned) => owned.base_id === pokemon.base_id);
        return ownedEntries.some((owned) =>
          (owned.egg_group_ids || [owned.egg_group_id]).includes(selectedGroupId),
        );
      });
    }

    if (genderFilter !== 'all') {
      result = result.filter((pokemon) =>
        myPokemon.some((owned) => owned.base_id === pokemon.base_id && owned.gender === genderFilter),
      );
    }

    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      result = result.filter((pokemon) =>
        (pokemon.display_name || String(pokemon.base_id)).toLowerCase().includes(normalizedQuery),
      );
    }

    return result;
  }, [groupedMyPokemon, myPokemon, selectedGroupId, genderFilter, searchQuery]);

  const stats = useMemo(
    () => ({
      total: myPokemon.length,
      male: myPokemon.filter((pokemon) => pokemon.gender === 'male').length,
      female: myPokemon.filter((pokemon) => pokemon.gender === 'female').length,
    }),
    [myPokemon],
  );

  const ownedPokemon = useMemo(
    () => {
      const ownedMap = new Map<number, typeof myPokemon>();
      myPokemon.forEach((pokemon) => {
        ownedMap.set(pokemon.base_id, [...(ownedMap.get(pokemon.base_id) || []), pokemon]);
      });
      return ownedMap;
    },
    [myPokemon],
  );

  const handleOwnedGenderToggle = (pokemon: Pokemon, gender: Gender, checked: boolean) => {
    const eggGroupIds = [
      ...new Set(
        allPokemon
          .filter((entry) => entry.base_id === pokemon.base_id)
          .map((entry) => entry.egg_group_id),
      ),
    ];

    if (checked) {
      addPokemonWithGenders(
        pokemon.base_id,
        pokemon.egg_group_id,
        [gender],
        pokemon.display_name,
        pokemon.avatar_url,
        eggGroupIds,
      );
      return;
    }

    removePokemon(pokemon.base_id, gender);
  };

  return (
    <div className="my-pokemon">
      <h2 className="page-title">我的精灵</h2>

      <div className="stats">
        <div className="stat-item">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">总计</span>
        </div>
        <div className="stat-item stat-item--male">
          <span className="stat-value">{stats.male}</span>
          <span className="stat-label">雄性</span>
        </div>
        <div className="stat-item stat-item--female">
          <span className="stat-value">{stats.female}</span>
          <span className="stat-label">雌性</span>
        </div>
      </div>

      <div className="page-filters">
        <EggGroupSelector
          eggGroups={eggGroups}
          selectedGroupId={selectedGroupId}
          onSelect={setSelectedGroupId}
        />
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索我的精灵..." />
        <select
          value={genderFilter}
          onChange={(event) => setGenderFilter(event.target.value as GenderFilter)}
          className="filter-select"
          aria-label="筛选性别"
        >
          <option value="all">全部性别</option>
          <option value="male">雄性</option>
          <option value="female">雌性</option>
        </select>
      </div>

      {filteredPokemon.length === 0 ? (
        <div className="page-empty">
          {myPokemon.length === 0 ? '还没有标记任何精灵。前往“蛋组库”添加。' : '没有符合条件的精灵。'}
        </div>
      ) : (
        <PokemonGrid
          pokemonList={filteredPokemon.map(toPokemonCardData)}
          ownedPokemon={ownedPokemon}
          actionMode="manage"
          showActions
          onOwnedGenderToggle={handleOwnedGenderToggle}
          onOpenPokemon={(baseId) => navigate(`/pokemon/${baseId}`)}
        />
      )}
    </div>
  );
};

export default MyPokemon;
