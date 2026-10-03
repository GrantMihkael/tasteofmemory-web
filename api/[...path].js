// Vercel serves this catch-all Node.js Function for every /api/* request.
// The same Express app is used by backend/index.js during local development.
import app from '../backend/index.js'

export default app
