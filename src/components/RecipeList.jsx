import RecipeCard from './RecipeCard'
import { Link } from 'react-router-dom'

function RecipeList({ recipes, newRecipeId, onEntryComplete, onToggleFavorite, onError, isAddPage = false }) {
  if (isAddPage) {
    return <div className="empty-state add-page-state"><span className="empty-mark" aria-hidden="true">+</span><h2>Save another recipe</h2><p>Add a family favorite, a weeknight staple, or a recipe worth keeping close.</p><Link className="button button-dark" to="/add">Add a recipe</Link></div>
  }

  if (!recipes.length) {
    return <div className="empty-state"><Link className="empty-mark" to="/add" aria-label="Add your first recipe">+</Link><h2>No recipes found</h2><p>Try another search, or <Link className="empty-add-link" to="/add">add a new family favorite</Link>.</p></div>
  }

  return <div className="recipe-grid recipe-grid-enter">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} isNew={recipe.id === newRecipeId} onEntryComplete={onEntryComplete} onToggleFavorite={onToggleFavorite} onError={onError} />)}</div>
}

export default RecipeList
