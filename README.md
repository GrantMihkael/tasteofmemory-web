# A Taste of Memory

[![Made with AI assistance](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

A Taste of Memory is a private recipe archive built with React, Node.js, Express, and PostgreSQL. It keeps recipes, photos, ingredients, cooking steps, and kitchen notes together in one place.

This project used OpenAI Codex extensively for UI review, responsive styling, debugging, and documentation. The project author designed and implemented the database schema, Spotify integration, login/session flow, backend recipe routes, and core UI, then reviewed all AI-assisted changes.

See [AI-USAGE.md](AI-USAGE.md) for the full AI-use record.

## Main features

- Shared-password login with signed HTTP-only session cookies
- Create, edit, duplicate, delete, search, filter, and favorite recipes
- PostgreSQL recipe storage
- Guided Cook Mode with ingredient drawer and keyboard navigation
- Optional Spotify music controls
- Responsive layouts for desktop and mobile

## Local setup

1. Copy `.env.example` to `.env` and add your PostgreSQL connection details.
2. Create the database and load the schema:

   ```powershell
   psql -U postgres -d recipe_box -f backend/schema.sql
   ```

3. Run the app:

   ```powershell
   npm.cmd install
   $env:PORT = 3002
   npm.cmd run dev
   ```

4. Open `http://127.0.0.1:5174`.

## Project structure

- `src/` — React routes, components, and styling
- `backend/` — Express API, PostgreSQL connection, routes, and schema
- `src/spotify/` — Spotify PKCE authentication helpers
- `AI-USAGE.md` — AI-use disclosure and contribution record
