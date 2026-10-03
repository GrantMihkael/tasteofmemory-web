import RecipeCard from './RecipeCard'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

function RecipeList({ recipes, newRecipeId, onEntryComplete, onToggleFavorite, onError, showAddSlots = false, isAddPage = false, pageSize = 8 }) {
  if (isAddPage) {
    return <div className="recipe-grid recipe-grid-enter add-recipe-grid">{Array.from({ length: pageSize }, (_, index) => <AddRecipeCard key={`add-page-slot-${index}`} />)}</div>
  }

  if (!recipes.length) {
    return <div className="empty-state"><Link className="empty-mark" to="/add" aria-label="Add your first recipe">+</Link><h2>No recipes found</h2><p>Try another search, or <Link className="empty-add-link" to="/add">add a new family favorite</Link>.</p></div>
  }

  const ghostCount = showAddSlots ? Math.max(0, pageSize - recipes.length) : 0

  return <div className="recipe-grid recipe-grid-enter">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} isNew={recipe.id === newRecipeId} onEntryComplete={onEntryComplete} onToggleFavorite={onToggleFavorite} onError={onError} />)}{Array.from({ length: ghostCount }, (_, index) => <AddRecipeCard key={`add-slot-${index}`} />)}</div>
}

function AddRecipeCard() {
  return <Link className="recipe-ghost" to="/add"><span className="recipe-ghost-image"><Plus aria-hidden="true" /></span><span className="recipe-ghost-copy">Add a recipe</span></Link>
}

export default RecipeList
