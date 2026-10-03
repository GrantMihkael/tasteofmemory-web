import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()
const categories = ['Favorites', 'Pastas', 'Sauces', 'Seafood', 'Meat & Poultry']
const difficulties = ['', 'Easy', 'Medium', 'Hard']
const isValid = (body) => body && typeof body.title === 'string' && body.title.trim() && categories.includes(body.category) && Array.isArray(body.ingredients) && body.ingredients.length > 0 && Array.isArray(body.steps) && body.steps.length > 0 && difficulties.includes(body.difficulty || '')
const valuesFrom = (body) => [body.title.trim(), body.category, JSON.stringify(body.ingredients), JSON.stringify(body.steps), body.notes || '', body.image || '', body.difficulty || '', Boolean(body.is_favorite ?? (body.category === 'Favorites'))]
const selectFields = 'id, title, category, ingredients, steps, notes, image, difficulty, is_favorite, created_at'

router.get('/', async (_request, response, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${selectFields} FROM recipes ORDER BY created_at ASC`)
    response.json(rows)
  } catch (error) { next(error) }
})

router.get('/:id', async (request, response, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${selectFields} FROM recipes WHERE id=$1`, [request.params.id])
    if (!rows[0]) return response.status(404).json({ error: 'Recipe not found.' })
    response.json(rows[0])
  } catch (error) { next(error) }
})

router.post('/', async (request, response, next) => {
  if (!isValid(request.body)) return response.status(400).json({ error: 'A title, category, ingredient, and step are required.' })
  try {
    const { rows } = await pool.query(`INSERT INTO recipes (title, category, ingredients, steps, notes, image, difficulty, is_favorite) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${selectFields}`, valuesFrom(request.body))
    response.status(201).json(rows[0])
  } catch (error) { next(error) }
})

router.put('/:id', async (request, response, next) => {
  if (!isValid(request.body)) return response.status(400).json({ error: 'A title, category, ingredient, and step are required.' })
  try {
    const { rows } = await pool.query(`UPDATE recipes SET title=$1, category=$2, ingredients=$3, steps=$4, notes=$5, image=$6, difficulty=$7, is_favorite=$8, updated_at=NOW() WHERE id=$9 RETURNING ${selectFields}`, [...valuesFrom(request.body), request.params.id])
    if (!rows[0]) return response.status(404).json({ error: 'Recipe not found.' })
    response.json(rows[0])
  } catch (error) { next(error) }
})

router.delete('/', async (_request, response, next) => {
  try {
    const result = await pool.query('DELETE FROM recipes')
    response.json({ deleted: result.rowCount })
  } catch (error) { next(error) }
})

router.delete('/:id', async (request, response, next) => {
  try {
    const result = await pool.query('DELETE FROM recipes WHERE id=$1', [request.params.id])
    if (!result.rowCount) return response.status(404).json({ error: 'Recipe not found.' })
    response.status(204).end()
  } catch (error) { next(error) }
})

export default router
