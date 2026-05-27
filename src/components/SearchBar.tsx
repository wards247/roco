import './SearchBar.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder = '搜索精灵...' }: Props) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="search-bar__input"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="search-bar__clear"
          aria-label="清空搜索"
        >
          x
        </button>
      )}
    </div>
  );
};

export default SearchBar;
