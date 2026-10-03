CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Favorites', 'Pastas', 'Sauces', 'Seafood', 'Meat & Poultry')),
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  difficulty VARCHAR(20) NOT NULL DEFAULT '' CHECK (difficulty IN ('', 'Easy', 'Medium', 'Hard')),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recipes_created_at_idx ON recipes (created_at);
