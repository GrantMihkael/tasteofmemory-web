function CategoryFilter({ categories, value, onChange }) {
  return (
    <div className="category-tabs-shell">
      <div className="category-tabs" role="group" aria-label="Filter recipes by category" tabIndex="0">
        <button className={value === 'all' ? 'category-tab active' : 'category-tab'} type="button" onClick={() => onChange('all')} aria-pressed={value === 'all'}>All recipes</button>
        {categories.map((category) => <button className={value === category ? 'category-tab active' : 'category-tab'} type="button" key={category} onClick={() => onChange(category)} aria-pressed={value === category}>{category}</button>)}
      </div>
    </div>
  )
}

export default CategoryFilter
