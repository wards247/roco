import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EggGroupSelector from '../components/EggGroupSelector';
import PokemonGrid from '../components/PokemonGrid';
import SearchBar from '../components/SearchBar';
import { useEggGroups } from '../hooks/useEggGroups';
import { useMyPokemon } from '../hooks/useMyPokemon';
import type { Gender, Pokemon } from '../types';
import { clampPageNumber, clampPageSize, MAX_PAGE_SIZE } from '../utils/pagination';
import './PokemonLibrary.css';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, MAX_PAGE_SIZE];

const PokemonLibrary = () => {
  const navigate = useNavigate();
  const { eggGroups, loading, searchPokemon } = useEggGroups();
  const { addPokemonWithGenders, getMyPokemonMap } = useMyPokemon();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [jumpPage, setJumpPage] = useState('1');
  const [choosingGenderBaseId, setChoosingGenderBaseId] = useState<number | null>(null);

  const filteredPokemon = useMemo(
    () => searchPokemon(searchQuery, selectedGroupId),
    [searchPokemon, searchQuery, selectedGroupId],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPokemon.length / pageSize));
  const activePage = clampPageNumber(currentPage, totalPages);
  const pagedPokemon = filteredPokemon.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleGroupSelect = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    setCurrentPage(1);
    setJumpPage('1');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setJumpPage('1');
  };

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = clampPageSize(Number(value));
    setPageSize(nextPageSize);
    setCurrentPage(1);
    setJumpPage('1');
  };

  const handleJumpPage = () => {
    const nextPage = clampPageNumber(Number(jumpPage), totalPages);
    setCurrentPage(nextPage);
    setJumpPage(String(nextPage));
  };

  const handleStepPage = (page: number) => {
    const nextPage = clampPageNumber(page, totalPages);
    setCurrentPage(nextPage);
    setJumpPage(String(nextPage));
  };

  const handleMarkAsMine = (pokemon: Pokemon) => {
    setChoosingGenderBaseId(pokemon.base_id);
  };

  const handleConfirmMarkAsMine = (pokemon: Pokemon, genders: Gender[]) => {
    const eggGroupIds = eggGroups
      .filter((group) => searchPokemon('', group.group_id).some((item) => item.base_id === pokemon.base_id))
      .map((group) => group.group_id);

    addPokemonWithGenders(
      pokemon.base_id,
      pokemon.egg_group_id,
      genders,
      pokemon.display_name,
      pokemon.avatar_url,
      eggGroupIds,
    );
    setChoosingGenderBaseId(null);
  };

  if (loading) {
    return <div className="page-loading">加载中...</div>;
  }

  return (
    <div className="pokemon-library">
      <h2 className="page-title">蛋组库</h2>
      <div className="page-filters">
        <EggGroupSelector
          eggGroups={eggGroups}
          selectedGroupId={selectedGroupId}
          onSelect={handleGroupSelect}
        />
        <SearchBar value={searchQuery} onChange={handleSearchChange} placeholder="搜索蛋组代表、族链..." />
      </div>
      <PokemonGrid
        pokemonList={pagedPokemon}
        ownedPokemon={getMyPokemonMap()}
        actionMode="library"
        choosingGenderBaseId={choosingGenderBaseId}
        showActions
        onMarkAsMine={handleMarkAsMine}
        onConfirmMarkAsMine={handleConfirmMarkAsMine}
        onCancelMarkAsMine={() => setChoosingGenderBaseId(null)}
        onOpenPokemon={(baseId) => navigate(`/pokemon/${baseId}`)}
      />
      {filteredPokemon.length > 0 && (
        <nav className="pagination" aria-label="蛋组库分页">
          <button
            type="button"
            className="pagination__button"
            onClick={() => handleStepPage(activePage - 1)}
            disabled={activePage === 1}
          >
            上一页
          </button>
          <span className="pagination__summary">
            第 {activePage} / {totalPages} 页，共 {filteredPokemon.length} 个
          </span>
          <label className="pagination__field">
            <span>每页</span>
            <select
              value={pageSize}
              onChange={(event) => handlePageSizeChange(event.target.value)}
              aria-label="每页显示数量"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="pagination__field">
            <span>跳到</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpPage}
              onChange={(event) => setJumpPage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleJumpPage();
                }
              }}
              aria-label="跳转页码"
            />
          </label>
          <button
            type="button"
            className="pagination__button pagination__button--compact"
            onClick={handleJumpPage}
          >
            跳转
          </button>
          <button
            type="button"
            className="pagination__button"
            onClick={() => handleStepPage(activePage + 1)}
            disabled={activePage === totalPages}
          >
            下一页
          </button>
        </nav>
      )}
    </div>
  );
};

export default PokemonLibrary;
