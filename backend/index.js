import 'dotenv/config'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { pool } from './db.js'
import recipeRoutes from './routes/recipes.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const sessionCookieName = 'taste_of_memory_session'
const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
const favoriteMigration = `
  ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) NOT NULL DEFAULT '';
  ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_difficulty_check;
  ALTER TABLE recipes ADD CONSTRAINT recipes_difficulty_check CHECK (difficulty IN ('', 'Easy', 'Medium', 'Hard'));
  CREATE TABLE IF NOT EXISTS app_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  WITH applied AS (
    INSERT INTO app_migrations (name)
    VALUES ('001_backfill_recipe_favorites')
    ON CONFLICT (name) DO NOTHING
    RETURNING name
  )
  UPDATE recipes
  SET is_favorite=TRUE
  WHERE category='Favorites' AND EXISTS (SELECT 1 FROM applied);
`
let databaseReady
const ensureDatabaseReady = () => {
  if (!databaseReady) databaseReady = pool.query(favoriteMigration)
  return databaseReady
}

app.set('trust proxy', 1)
app.use(express.json({ limit: '12mb' }))
app.use('/api', async (_request, _response, next) => {
  try {
    await ensureDatabaseReady()
    next()
  } catch (error) {
    next(error)
  }
})

const cookieAttributes = (maxAge) => [
  'Path=/',
  'HttpOnly',
  'SameSite=Lax',
  isProduction ? 'Secure' : '',
  maxAge ? `Max-Age=${Math.floor(maxAge / 1000)}` : 'Max-Age=0',
].filter(Boolean).join('; ')

const readCookie = (request, name) => request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)
const sign = (value) => crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(value).digest('base64url')
const isConfigured = () => Boolean(process.env.APP_PASSWORD && process.env.SESSION_SECRET)
const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}
const hasValidSession = (request) => {
  if (!isConfigured()) return false
  const token = readCookie(request, sessionCookieName)
  if (!token) return false
  const [expiresAt, signature] = token.split('.')
  return Boolean(expiresAt && signature && Number(expiresAt) > Date.now() && safeEqual(signature, sign(expiresAt)))
}
const requireSession = (request, response, next) => {
  if (!isConfigured()) return response.status(503).json({ error: 'Server authentication is not configured.' })
  if (!hasValidSession(request)) return response.status(401).json({ error: 'Please sign in to access this recipe archive.' })
  next()
}
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
})

app.get('/api/session', (request, response) => {
  if (!isConfigured()) return response.status(503).json({ error: 'Server authentication is not configured.' })
  response.json({ authenticated: hasValidSession(request) })
})
app.post('/api/login', loginRateLimit, (request, response) => {
  if (!isConfigured()) return response.status(503).json({ error: 'Server authentication is not configured.' })
  if (typeof request.body?.password !== 'string' || !safeEqual(request.body.password, process.env.APP_PASSWORD)) return response.status(401).json({ error: 'Incorrect password.' })
  const expiresAt = String(Date.now() + sessionLifetimeMs)
  response.setHeader('Set-Cookie', `${sessionCookieName}=${expiresAt}.${sign(expiresAt)}; ${cookieAttributes(sessionLifetimeMs)}`)
  response.json({ authenticated: true })
})
app.post('/api/logout', (_request, response) => {
  response.setHeader('Set-Cookie', `${sessionCookieName}=; ${cookieAttributes(0)}`)
  response.status(204).end()
})
app.get('/api/health', async (_request, response, next) => {
  try { await pool.query('SELECT 1'); response.json({ ok: true }) } catch (error) { next(error) }
})
app.use('/api/recipes', requireSession, recipeRoutes)

const backendDirectory = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(backendDirectory, '..', 'dist')))
app.get('*path', (_request, response) => response.sendFile(path.join(backendDirectory, '..', 'dist', 'index.html')))

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'The database could not complete this request.' })
})

const backendFile = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === backendFile) {
  ensureDatabaseReady().then(() => app.listen(port, () => console.log(`Recipe API running at http://localhost:${port}`))).catch((error) => {
    console.error('Could not connect to PostgreSQL. Run backend/schema.sql first:', error.message)
    process.exit(1)
  })
}

export default app
