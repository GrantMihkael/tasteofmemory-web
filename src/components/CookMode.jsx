import { ArrowLeft, ArrowRight, List, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SpotifyPlayer from './SpotifyPlayer'
import flipSoundUrl from '../assets/sounds/paper-flip.wav'

const units = '(?:cups?|tablespoons?|tbsp|teaspoons?|tsp|ounces?|oz|pounds?|lbs?|grams?|g|kilograms?|kg|milliliters?|ml|liters?|l|cloves?|cans?|packages?|packs?|pinches?|handfuls?|slices?|pieces?|sprigs?|stalks?)'
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function ingredientName(ingredient) {
  return ingredient
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*\d+(?:[./]\d+)?(?:\s+\d+\/\d+)?(?:\s*-\s*\d+(?:[./]\d+)?)?\s*/, '')
    .replace(/^\s*(?:an?|one)\s+/i, '')
    .replace(new RegExp(`^${units}\\s+(?:of\\s+)?`, 'i'), '')
    .replace(/^\s*(?:whole|fresh|ripe|large|medium|small)\s+/i, '')
    .split(/,|\s+for\s+|\s+to\s+taste/i)[0]
    .trim()
}

function pluralWordPattern(word) {
  const escaped = escapeRegex(word)
  if (/[^aeiou]y$/i.test(word)) return `${escapeRegex(word.slice(0, -1))}(?:y|ies)`
  if (/(?:ch|sh|x|z|o)$/i.test(word)) return `${escaped}(?:es)?`
  if (/s$/i.test(word)) return `${escapeRegex(word.slice(0, -1))}s?`
  return `${escaped}s?`
}

function ingredientsForStep(ingredients, step) {
  return ingredients.filter((ingredient) => {
    const name = ingredientName(ingredient)
    if (!name) return false
    const words = name.split(/\s+/)
    const last = words.pop()
    const phrase = [...words.map(escapeRegex), pluralWordPattern(last)].join('\\s+')
    return new RegExp(`\\b${phrase}\\b`, 'i').test(step)
  })
}

function CookMode({ recipe }) {
  const navigate = useNavigate()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [ingredientsOpen, setIngredientsOpen] = useState(false)
  const [flipState, setFlipState] = useState({ active: false, direction: 'forward', targetIndex: null })
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('cook-mode-sound-enabled') !== 'false')
  const stepRef = useRef(null)
  const ingredientsToggleRef = useRef(null)
  const ingredientsPanelRef = useRef(null)
  const wasIngredientsOpen = useRef(false)
  const flipTimer = useRef(null)
  const flipFrames = useRef([])
  const flipAudio = useRef(null)
  const transitionLocked = useRef(false)
  const total = recipe?.steps?.length || 0
  const detailPath = recipe ? `/recipes/${recipe.id}` : '/'
  // Automatic text matching trades manual tagging for convenience. Typos, uncommon
  // plurals, or differently phrased ingredient names may occasionally miss or over-match.
  const ingredientsByStep = useMemo(() => recipe
    ? recipe.steps.map((step) => ingredientsForStep(recipe.ingredients, step))
    : [], [recipe?.ingredients, recipe?.steps])
  const flipBusy = flipState.targetIndex !== null
  const move = (direction) => {
    if (transitionLocked.current || flipBusy) return
    const target = Math.min(total - 1, Math.max(0, currentStepIndex + direction))
    if (target === currentStepIndex) return
    const transitionDirection = direction > 0 ? 'forward' : 'backward'
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrentStepIndex((index) => Math.min(total - 1, Math.max(0, index + direction)))
      return
    }
    transitionLocked.current = true
    // Mount and paint the destination face before asking the compositor to rotate it.
    setFlipState({ active: false, direction: transitionDirection, targetIndex: target })
    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        if (soundEnabled && flipAudio.current) {
          flipAudio.current.currentTime = 0
          flipAudio.current.play().catch(() => {})
        }
        setFlipState({ active: true, direction: transitionDirection, targetIndex: target })
        flipTimer.current = window.setTimeout(() => {
          setCurrentStepIndex((index) => Math.min(total - 1, Math.max(0, index + direction)))
          setFlipState({ active: false, direction: transitionDirection, targetIndex: null })
          transitionLocked.current = false
        }, 400)
      })
      flipFrames.current.push(secondFrame)
    })
    flipFrames.current.push(firstFrame)
  }

  useEffect(() => { stepRef.current?.focus({ preventScroll: true }) }, [currentStepIndex])
  useEffect(() => {
    if (ingredientsOpen) ingredientsPanelRef.current?.querySelector('button')?.focus()
    else if (wasIngredientsOpen.current) ingredientsToggleRef.current?.focus()
    wasIngredientsOpen.current = ingredientsOpen
  }, [ingredientsOpen])
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])
  useEffect(() => {
    flipAudio.current = new Audio(flipSoundUrl)
    return () => {
      flipAudio.current?.pause()
      flipAudio.current = null
    }
  }, [])
  useEffect(() => { localStorage.setItem('cook-mode-sound-enabled', String(soundEnabled)) }, [soundEnabled])
  useEffect(() => () => {
    window.clearTimeout(flipTimer.current)
    flipFrames.current.forEach(window.cancelAnimationFrame)
    transitionLocked.current = false
  }, [])
  useEffect(() => {
    const handleKey = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable="true"]')) return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault()
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') currentStepIndex === total - 1 ? navigate(detailPath) : move(1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentStepIndex, total, navigate, detailPath, flipBusy, soundEnabled])

  if (!recipe) return <div className="cook-mode cook-missing"><h1>Recipe not found</h1><Link to="/">Return home</Link></div>

  return <div className={`cook-mode${ingredientsOpen ? ' ingredients-open' : ''}`}>
    <header className="cook-header"><Link to={detailPath} className="cook-close" aria-label="Exit Cook Mode"><X /></Link><span>Cook mode</span><div className="cook-header-tools"><button className="cook-sound-toggle" type="button" aria-pressed={soundEnabled} onClick={() => setSoundEnabled((enabled) => !enabled)} aria-label={soundEnabled ? 'Mute page flip sounds' : 'Turn on page flip sounds'}>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button><button ref={ingredientsToggleRef} className="ingredients-toggle" type="button" aria-expanded={ingredientsOpen} aria-controls="cook-ingredients" onClick={() => setIngredientsOpen((open) => !open)}><List size={18} /> Ingredients</button><strong>Step {currentStepIndex + 1} of {total}</strong></div></header>
    <div className="cook-progress" role="progressbar" aria-label="Recipe progress" aria-valuemin="1" aria-valuemax={total} aria-valuenow={currentStepIndex + 1} aria-valuetext={`Step ${currentStepIndex + 1} of ${total}`}><span style={{ transform: `scaleX(${(currentStepIndex + 1) / total})` }} /></div>
    <aside ref={ingredientsPanelRef} className="cook-ingredients" id="cook-ingredients" aria-hidden={!ingredientsOpen} inert={!ingredientsOpen ? '' : undefined}><div className="ingredients-drawer-heading"><div><span className="eyebrow">Keep close</span><h2>Ingredients</h2></div><button type="button" onClick={() => setIngredientsOpen(false)} aria-label="Close ingredients"><X /></button></div><ul>{recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul></aside>
    {ingredientsOpen && <button className="ingredients-backdrop" type="button" onClick={() => setIngredientsOpen(false)} aria-label="Close ingredients" />}
    <main className="cook-step"><span className="eyebrow">{recipe.title}</span><div className="cook-page-stack"><div className={`cook-flip-depth${flipState.active ? ' is-flipping' : ''}`}><div className={`cook-flip-card${flipState.active ? ` is-flipping flip-${flipState.direction}` : ''}`}><StepFace className="cook-step-front" step={recipe.steps[currentStepIndex]} matchedIngredients={ingredientsByStep[currentStepIndex]} textRef={stepRef} /><StepFace className="cook-step-back" step={recipe.steps[flipState.targetIndex ?? currentStepIndex]} matchedIngredients={ingredientsByStep[flipState.targetIndex ?? currentStepIndex]} /></div></div></div><div className="cook-actions"><button className="button button-quiet" type="button" disabled={currentStepIndex === 0 || flipBusy} onClick={() => move(-1)}><ArrowLeft /> Back</button><button className="button button-dark" type="button" disabled={flipBusy} onClick={() => currentStepIndex === total - 1 ? navigate(detailPath) : move(1)}>{currentStepIndex === total - 1 ? 'Finish' : 'Next step'} <ArrowRight /></button></div></main>
    <SpotifyPlayer returnPath={`/recipes/${recipe.id}/cook`} />
  </div>
}

function StepFace({ className, step, matchedIngredients, textRef }) {
  return <div className={`cook-step-page cook-step-face ${className}`}><p className={step.length > 140 ? 'long-step' : ''} ref={textRef} tabIndex={textRef ? '-1' : undefined}>{step}</p>{matchedIngredients.length > 0 && <div className="step-ingredients" aria-label="Ingredients used in this step">{matchedIngredients.map((ingredient, index) => <span key={`${ingredient}-${index}`}>{ingredient}</span>)}</div>}</div>
}

export default CookMode
