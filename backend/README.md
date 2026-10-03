# Recipe API setup

1. Install PostgreSQL and create a database named `recipe_box`.
2. Copy `.env.example` in the project root to `.env` and replace `your_password`.

   Local PostgreSQL normally uses port `5432`, as shown in `.env.example`.

3. Create the table:

   ```powershell
   psql -U postgres -d recipe_box -f backend/schema.sql
   ```

4. From the project root, start the frontend and backend together:

   ```powershell
   npm.cmd run dev
   ```

The React app runs on Vite's displayed URL. Requests under `/api` are proxied to the Express API at `http://localhost:3002`.

For a production-style local run, use `npm.cmd run build` and then `npm.cmd start`.

For Vercel deployment, configure `DATABASE_URL` with a hosted PostgreSQL connection string in Vercel's Environment Variables. A `localhost` database URL works only on your own computer.
