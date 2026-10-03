import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' ? { rejectUnauthorized: false } : false,
})
