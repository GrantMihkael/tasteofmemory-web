import { ChefHat, LogOut, Plus, Shuffle } from 'lucide-react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import appLogo from '../tasteofmemory logo.png'
import CategoryFilter from './components/CategoryFilter'
import { useConfirm } from './components/ConfirmModal'
import CookMode from './components/CookMode'
import RecipeDetail from './components/RecipeDetail'
import RecipeForm from './components/RecipeForm'
import RecipeList from './components/RecipeList'
import SearchBar from './components/SearchBar'
import SpotifyCallback from './components/SpotifyCallback'
import LoginPage from './components/LoginPage'

const recipeCategories = ['Favorites', 'Pastas', 'Sauces', 'Seafood', 'Meat & Poultry']

async function apiRequest(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'The recipe server is unavailable.')
  }
  return response.status === 204 ? null : response.json()
}

function App() {
  const [isOpening, setIsOpening] = useState(true)
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [newRecipeId, setNewRecipeId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [authStatus, setAuthStatus] = useState('checking')

  useEffect(() => {
    if (!isOpening) return undefined
    const timer = window.setTimeout(() => setIsOpening(false), 1800)
    return () => window.clearTimeout(timer)
  }, [isOpening])

  useEffect(() => {
    let active = true
    fetch('/api/session').then(async (response) => {
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Unable to check the archive session.')
      if (active) setAuthStatus(body.authenticated ? 'authenticated' : 'signed-out')
    }).catch((requestError) => { if (active) { setError(requestError.message); setAuthStatus('signed-out') } })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (authStatus !== 'authenticated') return undefined
    let active = true
    apiRequest('/api/recipes').then((data) => { if (active) setRecipes(data) }).catch((requestError) => { if (active) setError(requestError.message) }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [authStatus])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredRecipes = useMemo(() => recipes.filter((recipe) => {
    const query = searchTerm.toLowerCase().trim()
    const matchesSearch = !query || recipe.title.toLowerCase().includes(query) || recipe.ingredients.some((item) => item.toLowerCase().includes(query))
    const matchesCategory = selectedCategory === 'all' || (selectedCategory === 'Favorites' ? recipe.is_favorite : recipe.category === selectedCategory)
    return matchesSearch && matchesCategory
  }), [recipes, searchTerm, selectedCategory])

  const addRecipe = async (recipe) => {
    setError('')
    const saved = await apiRequest('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipe) })
    setRecipes((current) => [...current, saved])
    setNewRecipeId(saved.id)
    setToast('Recipe saved!')
    return saved
  }
  const duplicateRecipe = async (recipe) => {
    setError('')
    const saved = await apiRequest('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${recipe.title} (Copy)`,
        category: recipe.category,
        ingredients: [...recipe.ingredients],
        steps: [...recipe.steps],
        notes: recipe.notes,
        image: recipe.image,
        difficulty: recipe.difficulty,
        is_favorite: recipe.is_favorite,
      }),
    })
    setRecipes((current) => [...current, saved])
    setNewRecipeId(saved.id)
    setToast('Recipe duplicated')
    return saved
  }
  const updateRecipe = async (recipe) => {
    setError('')
    const saved = await apiRequest(`/api/recipes/${recipe.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipe) })
    setRecipes((current) => current.map((item) => item.id === saved.id ? saved : item))
    setToast('Recipe updated!')
  }
  const toggleFavorite = async (recipe, isFavorite) => {
    setError('')
    setRecipes((current) => current.map((item) => item.id === recipe.id ? { ...item, is_favorite: isFavorite } : item))
    try {
      const saved = await apiRequest(`/api/recipes/${recipe.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...recipe, is_favorite: isFavorite }) })
      setRecipes((current) => current.map((item) => item.id === saved.id ? saved : item))
      return saved
    } catch (requestError) {
      setRecipes((current) => current.map((item) => item.id === recipe.id ? recipe : item))
      throw requestError
    }
  }
  const deleteRecipe = async (id) => {
    setError('')
    await apiRequest(`/api/recipes/${id}`, { method: 'DELETE' })
    setRecipes((current) => current.filter((recipe) => recipe.id !== id))
  }
  const deleteAllRecipes = async () => {
    setError('')
    await apiRequest('/api/recipes', { method: 'DELETE' })
    setRecipes([])
    setToast('All recipes removed.')
  }

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    setRecipes([])
    setAuthStatus('signed-out')
  }

  if (isOpening || authStatus === 'checking') return <div className="opening-screen" role="status" aria-live="polite"><div className="kitchen-loader"><img src={appLogo} alt="A Taste of Memory" /></div><p>Warming up the kitchen...</p></div>
  if (authStatus !== 'authenticated') return <LoginPage onAuthenticated={() => { setError(''); setAuthStatus('authenticated') }} />

  return <div className="app-shell app-enter">
    <header className="site-header"><Link className="brand" to="/"><span className="brand-mark"><img src={appLogo} alt="" /></span><span>A Taste of <i>Memory</i></span></Link><button className="header-logout" type="button" onClick={() => logout().catch((requestError) => setError(requestError.message))}><LogOut size={16} /> Log out</button></header>
    <main>{error && <div className="api-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')}>Dismiss</button></div>}<Routes>
      <Route path="/" element={<Home recipes={filteredRecipes} total={recipes.length} isLoading={isLoading} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} newRecipeId={newRecipeId} onEntryComplete={() => setNewRecipeId(null)} onToggleFavorite={toggleFavorite} onDeleteAll={deleteAllRecipes} onError={setError} />} />
      <Route path="/add" element={<FormPage title="Add a recipe" subtitle="Put something good into the family archive." onSubmit={addRecipe} onError={setError} />} />
      <Route path="/recipes/:id" element={<DetailPage recipes={recipes} onDelete={deleteRecipe} onDuplicate={duplicateRecipe} onError={setError} />} />
      <Route path="/recipes/:id/edit" element={<EditPage recipes={recipes} onSubmit={updateRecipe} onError={setError} />} />
      <Route path="/recipes/:id/cook" element={<CookPage recipes={recipes} isLoading={isLoading} />} />
      <Route path="/spotify-callback" element={<SpotifyCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></main>
    <footer><span>A personal archive of good things</span><span>{recipes.length} recipes saved</span></footer>{toast && <div className="toast" role="status">{toast}</div>}
  </div>
}

function Home({ recipes, total, isLoading, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, newRecipeId, onEntryComplete, onToggleFavorite, onDeleteAll, onError }) {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobileView, setIsMobileView] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [surpriseRecipe, setSurpriseRecipe] = useState(null)
  const [surpriseFlipping, setSurpriseFlipping] = useState(false)
  const pageSize = isMobileView ? 5 : 8
  const recipePageCount = Math.max(1, Math.ceil(recipes.length / pageSize))
  const pageCount = recipePageCount + 1
  const safePage = Math.min(currentPage, Math.max(pageCount, 1))
  const isAddPage = safePage > recipePageCount
  const pageRecipes = isAddPage ? [] : recipes.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const updateMobileView = (event) => setIsMobileView(event.matches)
    setIsMobileView(mobileQuery.matches)
    mobileQuery.addEventListener('change', updateMobileView)
    return () => mobileQuery.removeEventListener('change', updateMobileView)
  }, [])
  useEffect(() => setCurrentPage(1), [searchTerm, selectedCategory, pageSize])
  useEffect(() => {
    if (currentPage > Math.max(pageCount, 1)) setCurrentPage(Math.max(pageCount, 1))
  }, [currentPage, pageCount])
  useEffect(() => {
    if (!surpriseRecipe) return undefined
    let cancelled = false
    let firstFrame
    let secondFrame
    let navigationTimer
    const beginReveal = async () => {
      if (surpriseRecipe.image) {
        const image = new Image()
        image.src = surpriseRecipe.image
        await image.decode?.().catch(() => {})
      }
      if (cancelled) return
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (cancelled) return
          setSurpriseFlipping(true)
          navigationTimer = window.setTimeout(() => navigate(`/recipes/${surpriseRecipe.id}`), 1080)
        })
      })
    }
    beginReveal()
    return () => {
      cancelled = true
      if (firstFrame) window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
      if (navigationTimer) window.clearTimeout(navigationTimer)
    }
  }, [navigate, surpriseRecipe])

  const surpriseMe = () => {
    if (!recipes.length) return
    const recipe = recipes[Math.floor(Math.random() * recipes.length)]
    const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const prefersReducedMotion = reducedMotionQuery?.media === '(prefers-reduced-motion: reduce)' && reducedMotionQuery.matches
    if (prefersReducedMotion) {
      navigate(`/recipes/${recipe.id}`)
      return
    }
    setSurpriseFlipping(false)
    setSurpriseRecipe(recipe)
  }
  const removeAll = async () => {
    const accepted = await confirm({ title: 'Remove every recipe?', message: `This will permanently delete all ${total} recipes in your recipe box. This can't be undone.`, confirmLabel: 'Delete all' })
    if (!accepted) return
    try { await onDeleteAll() } catch (error) { onError(error.message) }
  }
  return <section className="home-page"><div className="home-intro"><div><span className="eyebrow">The family archive</span><h1>A Taste of <i>Memory</i></h1><p>Recipes gathered from the people, places, and moments that make a kitchen feel like home.</p></div><div className="recipe-count"><strong>{String(total).padStart(2, '0')}</strong><span>recipes<br />kept close</span></div></div><div className="toolbar"><SearchBar value={searchTerm} onChange={setSearchTerm} /><button className="button button-quiet surprise-button" type="button" onClick={surpriseMe} disabled={isLoading || recipes.length === 0 || Boolean(surpriseRecipe)} title={!isLoading && recipes.length === 0 ? 'Nothing to surprise you with yet' : undefined}><Shuffle size={17} /> Surprise me</button><CategoryFilter categories={recipeCategories} value={selectedCategory} onChange={setSelectedCategory} /></div><div className="list-heading"><h2>Your recipe box</h2><div className="list-heading-tools"><span>{isLoading ? 'Loading...' : `${recipes.length} ${recipes.length === 1 ? 'recipe' : 'recipes'}`}</span><Link className="button button-quiet list-add-recipe" to="/add"><Plus size={16} /> Add recipe</Link>{total > 0 && <button type="button" onClick={removeAll}>Remove all</button>}</div></div>{isLoading ? <div className="data-loading" role="status">Gathering recipes from the kitchen...</div> : <><RecipeList key={`${searchTerm}-${selectedCategory}-${safePage}`} recipes={pageRecipes} newRecipeId={newRecipeId} onEntryComplete={onEntryComplete} onToggleFavorite={onToggleFavorite} onError={onError} showAddSlots={!isAddPage && safePage === recipePageCount} isAddPage={isAddPage} pageSize={pageSize} /><nav className="pagination" aria-label="Recipe pages"><button className="button button-quiet" type="button" disabled={safePage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button><span>Page {safePage} of {pageCount}</span><button className="button button-quiet" type="button" disabled={safePage === pageCount} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></nav></>}{surpriseRecipe && <div className="surprise-overlay" role="status" aria-live="polite" aria-label={`Surprise recipe: ${surpriseRecipe.title}`}><div className="surprise-scene"><div className={`surprise-card${surpriseFlipping ? ' is-flipped' : ''}`}><div className="surprise-card-face surprise-card-back" /><div className="surprise-card-face surprise-card-front">{surpriseRecipe.image ? <img src={surpriseRecipe.image} alt="" /> : <div className="surprise-image-placeholder"><ChefHat size={54} aria-hidden="true" /></div>}<div><span className="eyebrow">Your surprise</span><h2>{surpriseRecipe.title}</h2></div></div></div></div></div>}</section>
}

function FormPage({ title, subtitle, recipe, onSubmit, onError }) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submit = async (value) => { setIsSubmitting(true); try { await onSubmit(value); navigate('/') } catch (requestError) { onError(requestError.message); setIsSubmitting(false) } }
  return <section className="form-page"><div className="page-heading"><span className="eyebrow">{recipe ? 'Make a change' : 'Add to the archive'}</span><h1>{title}</h1><p>{subtitle}</p></div><RecipeForm initialRecipe={recipe} onSubmit={submit} onCancel={() => navigate(-1)} isSubmitting={isSubmitting} /></section>
}

function DetailPage({ recipes, onDelete, onDuplicate, onError }) { const { id } = useParams(); return <RecipeDetail recipe={recipes.find((item) => String(item.id) === id)} onDelete={onDelete} onDuplicate={onDuplicate} onError={onError} /> }
function EditPage({ recipes, onSubmit, onError }) { const { id } = useParams(); const recipe = recipes.find((item) => String(item.id) === id); return recipe ? <FormPage title="Edit recipe" subtitle="Keep the good parts, update the rest." recipe={recipe} onSubmit={onSubmit} onError={onError} /> : <Navigate to="/" replace /> }
function CookPage({ recipes, isLoading }) {
  const { id } = useParams()
  // Escape the animated app shell: transformed ancestors change fixed-position bounds.
  return createPortal(isLoading
    ? <div className="cook-mode cook-missing">Loading recipe...</div>
    : <CookMode key={id} recipe={recipes.find((item) => String(item.id) === id)} />, document.body)
}

export default App
