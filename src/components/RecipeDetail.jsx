import { ArrowLeft, ChefHat, Clock3, Copy, Edit3, List, NotebookPen, Trash2, Utensils } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useConfirm } from './ConfirmModal'

function RecipeDetail({ recipe, onDelete, onDuplicate, onError }) {
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const confirm = useConfirm()

  if (!recipe) {
    return <div className="not-found"><h1>Recipe not found</h1><Link className="text-link" to="/">Return to the archive</Link></div>
  }

  const handleDelete = async () => {
    const accepted = await confirm({ title: 'Remove this recipe?', message: `This will permanently delete “${recipe.title}”. This can't be undone.`, confirmLabel: 'Delete recipe' })
    if (!accepted) return
    setIsDeleting(true)
    window.setTimeout(async () => {
      try {
        await onDelete(recipe.id)
        navigate('/')
      } catch (error) {
        setIsDeleting(false)
        onError(error.message)
      }
    }, 280)
  }
  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const copy = await onDuplicate(recipe)
      navigate(`/recipes/${copy.id}`)
    } catch (error) {
      onError(error.message)
      setIsDuplicating(false)
    }
  }

  return (
    <div className={`detail-page${isDeleting ? ' detail-page-exit' : ''}`}>
      <Link className="back-link" to="/"><ArrowLeft size={17} /> Back to archive</Link>
      <div className="detail-hero">
        <div className="detail-image">
          {recipe.image ? <img src={recipe.image} alt={recipe.title} /> : <Utensils size={70} strokeWidth={1} aria-hidden="true" />}
        </div>
        <div className="detail-heading">
          <span className="eyebrow">{recipe.category}</span>
          <h1>{recipe.title}</h1>
          <p className="detail-intro">A recipe worth keeping close, made for the table and the people around it.</p>
          {recipe.difficulty && <dl className="recipe-facts"><div><dt>Difficulty</dt><dd>{recipe.difficulty}</dd></div></dl>}
          <div className="detail-actions">
            <Link className="button button-cook" to={`/recipes/${recipe.id}/cook`}><ChefHat size={17} /> Start cooking</Link>
            <Link className="button button-dark" to={`/recipes/${recipe.id}/edit`}><Edit3 size={17} /> Edit recipe</Link>
            <button className="button button-quiet" type="button" onClick={handleDuplicate} disabled={isDuplicating}><Copy size={17} /> {isDuplicating ? 'Duplicating...' : 'Duplicate'}</button>
            <button className="button button-quiet" type="button" onClick={handleDelete}><Trash2 size={17} /> Delete</button>
          </div>
        </div>
      </div>
      <div className="detail-content">
        <section className="recipe-section">
          <div className="section-label"><List size={18} /><span>Ingredients</span></div>
          <ul className="ingredient-list">{recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul>
        </section>
        <section className="recipe-section steps-section">
          <div className="section-label"><Clock3 size={18} /><span>Method</span></div>
          <ol className="steps-list">{recipe.steps.map((step, index) => <li key={`${step}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>)}</ol>
        </section>
        {recipe.notes && <section className="notes-block"><NotebookPen size={20} /><div><span className="section-label">A note from the kitchen</span><p>{recipe.notes}</p></div></section>}
      </div>
    </div>
  )
}

export default RecipeDetail
