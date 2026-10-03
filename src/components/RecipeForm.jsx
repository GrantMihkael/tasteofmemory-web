import { ImagePlus, Minus, Pencil, Plus, Save, Trash2, Utensils } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useConfirm } from './ConfirmModal'

const categories = ['Favorites', 'Pastas', 'Sauces', 'Seafood', 'Meat & Poultry']
const emptyForm = { title: '', category: 'Favorites', difficulty: '', ingredients: [], steps: [], notes: '', image: '' }

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = reject
  reader.readAsDataURL(file)
})

async function processRecipeImage(file) {
  const originalDataUrl = await readAsDataUrl(file)
  try {
    let source
    if ('createImageBitmap' in window) {
      source = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } else {
      source = await new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = reject
        image.src = originalDataUrl
      })
    }

    const sourceWidth = source.width
    const sourceHeight = source.height
    const targetRatio = 4 / 3
    let cropWidth = sourceWidth
    let cropHeight = sourceHeight
    let sourceX = 0
    let sourceY = 0
    if (sourceWidth / sourceHeight > targetRatio) {
      cropWidth = sourceHeight * targetRatio
      sourceX = (sourceWidth - cropWidth) / 2
    } else {
      cropHeight = sourceWidth / targetRatio
      sourceY = (sourceHeight - cropHeight) / 2
    }

    const scale = Math.min(1, 1200 / cropWidth)
    const outputWidth = Math.max(4, Math.round(cropWidth * scale))
    const outputHeight = Math.max(3, Math.round(outputWidth / targetRatio))
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas is unavailable')
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
    context.fillRect(0, 0, outputWidth, outputHeight)
    context.drawImage(source, sourceX, sourceY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)
    source.close?.()

    // Conservative normalization: a small contrast lift plus limited brightness
    // correction for unusually dark or washed-out phone photos.
    const pixels = context.getImageData(0, 0, outputWidth, outputHeight)
    let luminance = 0
    let samples = 0
    for (let index = 0; index < pixels.data.length; index += 64) {
      luminance += pixels.data[index] * .2126 + pixels.data[index + 1] * .7152 + pixels.data[index + 2] * .0722
      samples += 1
    }
    const average = luminance / Math.max(1, samples)
    const brightness = average < 82 ? 1.08 : average > 205 ? .96 : 1
    const contrast = 1.025
    for (let index = 0; index < pixels.data.length; index += 4) {
      pixels.data[index] = Math.max(0, Math.min(255, ((pixels.data[index] - 128) * contrast + 128) * brightness))
      pixels.data[index + 1] = Math.max(0, Math.min(255, ((pixels.data[index + 1] - 128) * contrast + 128) * brightness))
      pixels.data[index + 2] = Math.max(0, Math.min(255, ((pixels.data[index + 2] - 128) * contrast + 128) * brightness))
    }
    context.putImageData(pixels, 0, 0)

    return await new Promise((resolve) => canvas.toBlob((blob) => {
      if (!blob) { resolve(canvas.toDataURL('image/jpeg', .82)); return }
      readAsDataUrl(blob).then(resolve).catch(() => resolve(canvas.toDataURL('image/jpeg', .82)))
    }, 'image/jpeg', .82))
  } catch {
    return originalDataUrl
  }
}

function RecipeForm({ initialRecipe, onSubmit, onCancel, isSubmitting = false }) {
  const confirm = useConfirm()
  const [form, setForm] = useState(initialRecipe || emptyForm)
  const [ingredientDraft, setIngredientDraft] = useState('')
  const [stepDraft, setStepDraft] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const ingredientInputRef = useRef(null)
  const stepInputRef = useRef(null)

  useEffect(() => setForm(initialRecipe ? { ...emptyForm, ...initialRecipe } : emptyForm), [initialRecipe])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const resizeListInput = (element) => {
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`
  }
  const resetListInput = (reference) => window.requestAnimationFrame(() => {
    if (reference.current) reference.current.style.height = '46px'
  })
  const addIngredientList = () => {
    const items = ingredientDraft.split(/\r?\n|;/).map((item) => item.trim().replace(/^[-•]\s*/, '')).filter(Boolean)
    if (!items.length) return
    update('ingredients', [...form.ingredients, ...items])
    setIngredientDraft('')
    resetListInput(ingredientInputRef)
  }
  const addStepList = () => {
    const items = stepDraft.split(/\r?\n|;/).map((item) => item.trim().replace(/^(?:[-•]|\d+[.)])\s*/, '')).filter(Boolean)
    if (!items.length) return
    update('steps', [...form.steps, ...items])
    setStepDraft('')
    resetListInput(stepInputRef)
  }
  const removeItem = async (field, index) => {
    const label = field === 'ingredients' ? form[field][index] : `step ${index + 1}`
    const accepted = await confirm({ title: `Remove this ${field === 'ingredients' ? 'ingredient' : 'step'}?`, message: `This will remove “${label}” from the recipe.`, confirmLabel: 'Remove' })
    if (accepted) update(field, form[field].filter((_, itemIndex) => itemIndex !== index))
  }
  const editItem = async (field, index) => {
    const revised = null
    if (!revised?.trim() || revised.trim() === form[field][index]) return
    const accepted = await confirm({ title: 'Save this change?', message: `Replace “${form[field][index]}” with “${revised.trim()}”?`, confirmLabel: 'Save change' })
    if (!accepted) return
    update(field, form[field].map((item, itemIndex) => itemIndex === index ? revised.trim() : item))
  }
  const clearItems = async (field) => {
    if (!form[field].length) return
    const accepted = await confirm({ title: `Remove all ${field}?`, message: `This will remove all ${form[field].length} ${field} from this recipe. This can't be undone.`, confirmLabel: 'Remove all' })
    if (accepted) update(field, [])
  }
  const beginEdit = (field, index) => setEditingItem({ field, index, value: form[field][index] })
  const saveEdit = () => {
    if (!editingItem) return
    const revised = editingItem.value.trim()
    if (revised) update(editingItem.field, form[editingItem.field].map((item, itemIndex) => itemIndex === editingItem.index ? revised : item))
    setEditingItem(null)
  }
  const handleImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsProcessingImage(true)
    try { update('image', await processRecipeImage(file)) } finally { setIsProcessingImage(false) }
  }
  const handleSubmit = (event) => {
    event.preventDefault()
    if (isProcessingImage || !form.title.trim() || !form.ingredients.length || !form.steps.length) return
    onSubmit({ ...form, title: form.title.trim() })
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field field-wide"><span>Recipe title</span><input required value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Grandma's Sunday sauce" /></label>
        <label className="field"><span>Category</span><select value={form.category} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label className="field"><span>Difficulty</span><select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}><option value="">Not specified</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></label>
        <div className="photo-field field-wide">
          <div className={`photo-preview${isProcessingImage ? ' photo-processing' : ''}`}>{form.image ? <img src={form.image} alt="Processed 4 by 3 recipe preview" /> : <Utensils size={38} strokeWidth={1.2} />}{isProcessingImage && <span>Processing...</span>}</div>
          <div><span className="field-title">Recipe photo</span><p>The preview shows the cropped photo exactly as it will be saved.</p><input id="recipe-photo" className="visually-hidden-file" type="file" accept="image/*" onChange={handleImage} disabled={isProcessingImage} /><label className="upload-button" htmlFor="recipe-photo"><ImagePlus size={16} /> {form.image ? 'Replace image' : 'Choose image'}</label></div>
        </div>
        <div className="list-builder field-wide"><div className="builder-heading"><label className="field-title" htmlFor="ingredients-input">Ingredients</label><div className="builder-tools"><span>{form.ingredients.length} added</span>{form.ingredients.length > 0 && <button type="button" onClick={() => clearItems('ingredients')}><Trash2 size={14} /> Remove all</button>}</div></div><p className="builder-help">Type one ingredient, or paste a whole list with one ingredient per line.</p><div className="add-row add-row-list"><textarea id="ingredients-input" ref={ingredientInputRef} rows="1" value={ingredientDraft} onInput={(event) => resizeListInput(event.currentTarget)} onChange={(event) => setIngredientDraft(event.target.value)} onKeyDown={(event) => (event.ctrlKey || event.metaKey) && event.key === 'Enter' && (event.preventDefault(), addIngredientList())} placeholder="Add ingredients, one per line" aria-label="Ingredients, one per line" /><button className="icon-button" type="button" onClick={addIngredientList} aria-label="Add ingredient list"><Plus size={19} /></button></div><span className="keyboard-hint">Press Ctrl + Enter to add the list</span><ul className="draft-list">{form.ingredients.map((item, index) => <DraftItem key={`${item}-${index}`} item={item} field="ingredients" index={index} editingItem={editingItem} setEditingItem={setEditingItem} onEdit={() => beginEdit('ingredients', index)} onSave={saveEdit} onRemove={() => removeItem('ingredients', index)} />)}</ul></div>
        <div className="list-builder field-wide"><div className="builder-heading"><label className="field-title" htmlFor="steps-input">Steps</label><div className="builder-tools"><span>{form.steps.length} added</span>{form.steps.length > 0 && <button type="button" onClick={() => clearItems('steps')}><Trash2 size={14} /> Remove all</button>}</div></div><p className="builder-help">Type one step, or paste the full method with one step per line.</p><div className="add-row add-row-list"><textarea id="steps-input" ref={stepInputRef} rows="1" value={stepDraft} onInput={(event) => resizeListInput(event.currentTarget)} onChange={(event) => setStepDraft(event.target.value)} onKeyDown={(event) => (event.ctrlKey || event.metaKey) && event.key === 'Enter' && (event.preventDefault(), addStepList())} placeholder="Add steps, one per line" aria-label="Recipe steps, one per line" /><button className="icon-button" type="button" onClick={addStepList} aria-label="Add step list"><Plus size={19} /></button></div><span className="keyboard-hint">Press Ctrl + Enter to add the list</span><ol className="draft-list numbered">{form.steps.map((item, index) => <DraftItem key={`${item}-${index}`} item={item} field="steps" index={index} editingItem={editingItem} setEditingItem={setEditingItem} onEdit={() => beginEdit('steps', index)} onSave={saveEdit} onRemove={() => removeItem('steps', index)} />)}</ol></div>
        <label className="field field-wide"><span>Notes from the kitchen</span><textarea rows="4" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="The story, the shortcut, or the person who taught you..." /></label>
      </div>
      <div className="form-actions"><button className="button button-dark" type="submit" disabled={isSubmitting || isProcessingImage}><Save size={17} /> {isProcessingImage ? 'Processing photo...' : isSubmitting ? 'Saving...' : 'Save recipe'}</button><button className="button button-quiet" type="button" onClick={onCancel} disabled={isSubmitting || isProcessingImage}>Cancel</button></div>
    </form>
  )
}

function DraftItem({ item, field, index, editingItem, setEditingItem, onEdit, onSave, onRemove }) {
  const isEditing = editingItem?.field === field && editingItem.index === index
  const inputLabel = field === 'ingredients' ? `Edit ingredient: ${item}` : `Edit step ${index + 1}`
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') setEditingItem(null)
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSave() }
  }

  return <li>{isEditing ? <div className="inline-edit"><textarea autoFocus rows="1" value={editingItem.value} onChange={(event) => setEditingItem((current) => ({ ...current, value: event.target.value }))} onKeyDown={handleKeyDown} aria-label={inputLabel} /><div><button className="button button-quiet" type="button" onClick={onSave}>Save</button><button className="button button-quiet" type="button" onClick={() => setEditingItem(null)}>Cancel</button></div></div> : <><span>{item}</span><div className="draft-actions"><button type="button" onClick={onEdit} aria-label={inputLabel}><Pencil size={14} /></button><button type="button" onClick={onRemove} aria-label={`Remove ${field === 'ingredients' ? item : `step ${index + 1}`}`}><Minus size={15} /></button></div></>}</li>
}

export default RecipeForm
