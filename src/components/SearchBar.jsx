import { Search, X } from 'lucide-react'

function SearchBar({ value, onChange }) {
  return (
    <label className="search-box">
      <Search size={19} strokeWidth={1.8} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search recipes or ingredients"
        aria-label="Search recipes or ingredients"
      />
      {value && (
        <button type="button" className="icon-button subtle" onClick={() => onChange('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </label>
  )
}

export default SearchBar
