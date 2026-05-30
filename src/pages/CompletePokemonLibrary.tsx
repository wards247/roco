import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EggGroupSelector from '../components/EggGroupSelector';
import RocomPetCard from '../components/RocomPetCard';
import SearchBar from '../components/SearchBar';
import { useEggGroups } from '../hooks/useEggGroups';
import { useRocomPets } from '../hooks/useRocomPets';
import {
  clampPageNumber,
  clampPageSize,
  getPersistedPageSize,
  MAX_PAGE_SIZE,
  persistPageSize,
} from '../utils/pagination';
import './CompletePokemonLibrary.css';

const DEFAULT_PAGE_SIZE = 24;
const PAGE_SIZE_OPTIONS = [24, 50, 100, 500, MAX_PAGE_SIZE];

const CompletePokemonLibrary = () => {
  const navigate = useNavigate();
  const { petCards, loading } = useRocomPets();
  const { eggGroups } = useEggGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => getPersistedPageSize(DEFAULT_PAGE_SIZE));
  const [jumpPage, setJumpPage] = useState('1');

  const eggGroupNameById = useMemo(
    () => new Map(eggGroups.map((group) => [group.group_id, group.group_display])),
    [eggGroups],
  );

  const filteredPets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return petCards.filter((pet) => {
      const matchesGroup = !selectedGroupId || pet.eggGroupIds.includes(selectedGroupId);
      const matchesQuery =
        !normalizedQuery ||
        pet.name.toLowerCase().includes(normalizedQuery) ||
        pet.assetName.toLowerCase().includes(normalizedQuery) ||
        String(pet.id).includes(normalizedQuery) ||
        pet.typeName.toLowerCase().includes(normalizedQuery);

      return matchesGroup && matchesQuery;
    });
  }, [petCards, searchQuery, selectedGroupId]);

  const totalPages = Math.max(1, Math.ceil(filteredPets.length / pageSize));
  const activePage = clampPageNumber(currentPage, totalPages);
  const pagedPets = filteredPets.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setJumpPage('1');
  };

  const handleGroupSelect = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    setCurrentPage(1);
    setJumpPage('1');
  };

  const handlePageSizeChange = (value: string) => {
    const nextPageSize = clampPageSize(Number(value));
    setPageSize(nextPageSize);
    persistPageSize(nextPageSize);
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

  if (loading) {
    return <div className="page-loading">加载完整精灵库...</div>;
  }

  return (
    <div className="complete-library">
      <h2 className="page-title">完整精灵库</h2>
      <div className="complete-library__summary">
        收录 {petCards.length} 个精灵，当前筛选 {filteredPets.length} 个
      </div>

      <div className="page-filters">
        <EggGroupSelector
          eggGroups={eggGroups}
          selectedGroupId={selectedGroupId}
          onSelect={handleGroupSelect}
        />
        <SearchBar value={searchQuery} onChange={handleSearchChange} placeholder="搜索名称、编号、属性..." />
      </div>

      <div className="complete-library__grid">
        {pagedPets.map((pet) => (
          <RocomPetCard
            key={pet.id}
            pet={pet}
            eggGroupNames={pet.eggGroupIds.map((groupId) => eggGroupNameById.get(groupId) || `蛋组 #${groupId}`)}
            onOpenPet={(id) => navigate(`/pokemon/${id}`)}
          />
        ))}
      </div>

      {filteredPets.length > 0 && (
        <nav className="pagination" aria-label="完整精灵库分页">
          <button
            type="button"
            className="pagination__button"
            onClick={() => handleStepPage(activePage - 1)}
            disabled={activePage === 1}
          >
            上一页
          </button>
          <span className="pagination__summary">
            第 {activePage} / {totalPages} 页，共 {filteredPets.length} 个
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

export default CompletePokemonLibrary;
