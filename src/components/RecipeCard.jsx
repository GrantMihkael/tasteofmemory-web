import { ArrowUpRight, Heart, Utensils } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useConfirm } from './ConfirmModal'

function RecipeCard({ recipe, isNew, onEntryComplete, onToggleFavorite, onError }) {
  const confirm = useConfirm()
  const [isSavingFavorite, setIsSavingFavorite] = useState(false)
  const [isPopping, setIsPopping] = useState(false)
  const isFavorite = Boolean(recipe.is_favorite)

  const toggleFavorite = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (isSavingFavorite) return
    if (isFavorite) {
      const accepted = await confirm({ title: 'Remove from Favorites?', message: `Remove “${recipe.title}” from your Favorites? You can add it again at any time.`, confirmLabel: 'Remove' })
      if (!accepted) return
    }
    setIsPopping(false)
    window.requestAnimationFrame(() => setIsPopping(true))
    setIsSavingFavorite(true)
    try { await onToggleFavorite(recipe, !isFavorite) } catch (error) { onError(error.message) } finally { setIsSavingFavorite(false) }
  }

  return (
    <article className={`recipe-card${isNew ? ' recipe-card-new' : ''}`} onAnimationEnd={(event) => event.target === event.currentTarget && isNew && onEntryComplete?.()}>
      <Link className="recipe-card-main" to={`/recipes/${recipe.id}`}>
        {recipe.category !== 'Favorites' && <span className="card-category">{recipe.category}</span>}
        <div className="recipe-card-image">
          {recipe.image ? <img src={recipe.image} alt="" /> : <Utensils size={34} strokeWidth={1.2} aria-hidden="true" />}
        </div>
        <div className="recipe-card-copy">
          <h3>{recipe.title}</h3>
          <span className="card-link">Open recipe <ArrowUpRight size={16} /></span>
        </div>
      </Link>
      <button className={`favorite-button${isFavorite ? ' is-favorite' : ''}${isPopping ? ' favorite-pop' : ''}`} type="button" onClick={toggleFavorite} onAnimationEnd={() => setIsPopping(false)} disabled={isSavingFavorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={isFavorite}><Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" /></button>
    </article>
  )
}

export default RecipeCard
