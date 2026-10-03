import 'dotenv/config'
import pg from 'pg'

const source = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const target = new pg.Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  const { rows } = await source.query('SELECT id, title, category, ingredients, steps, notes, image, difficulty, is_favorite, created_at, updated_at FROM recipes ORDER BY id')
  const client = await target.connect()
  try {
    await client.query('BEGIN')
    for (const recipe of rows) {
      await client.query(
        `INSERT INTO recipes (id, title, category, ingredients, steps, notes, image, difficulty, is_favorite, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           ingredients = EXCLUDED.ingredients,
           steps = EXCLUDED.steps,
           notes = EXCLUDED.notes,
           image = EXCLUDED.image,
           difficulty = EXCLUDED.difficulty,
           is_favorite = EXCLUDED.is_favorite,
           created_at = EXCLUDED.created_at,
           updated_at = EXCLUDED.updated_at`,
        [recipe.id, recipe.title, recipe.category, JSON.stringify(recipe.ingredients), JSON.stringify(recipe.steps), recipe.notes, recipe.image, recipe.difficulty, recipe.is_favorite, recipe.created_at, recipe.updated_at],
      )
    }
    await client.query("SELECT setval(pg_get_serial_sequence('recipes', 'id'), COALESCE((SELECT MAX(id) FROM recipes), 1), true)")
    await client.query('COMMIT')
    const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS count FROM recipes')
    console.log(`Imported ${rows.length} local recipes. Supabase now has ${countRows[0].count} recipes.`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
} finally {
  await Promise.all([source.end(), target.end()])
}
