function CategoryFilter({ categories, value, onChange }) {
  return (
    <div className="category-tabs-shell" aria-describedby="category-filter-hint">
      <div className="category-tabs" role="group" aria-label="Filter recipes by category">
        <button className={value === 'all' ? 'category-tab active' : 'category-tab'} type="button" onClick={() => onChange('all')} aria-pressed={value === 'all'}>All recipes</button>
        {categories.map((category) => <button className={value === category ? 'category-tab active' : 'category-tab'} type="button" key={category} onClick={() => onChange(category)} aria-pressed={value === category}>{category}</button>)}
      </div>
      <span id="category-filter-hint" className="category-filter-hint">Swipe to see more categories.</span>
    </div>
  )
}

export default CategoryFilter
