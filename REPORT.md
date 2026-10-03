# Weekly Increment Report

## Week of: September 27, 2026

## What changed this week

- Updated the shared-password login so recipe API routes require a signed, HTTP-only session. There is still no accounts table because this is a personal recipe archive.
- Added rate limiting to the login endpoint to slow down repeated incorrect password attempts.
- Prepared the app for Vercel by adding the API function route, Vercel configuration, production-only secure cookies, and server-only environment-variable documentation.
- Updated the documentation with the project setup, run instructions, required environment variables, a screenshot, an AI credit line, and an AI usage file.
- Added a Difficulty field to the Add Recipe and Edit Recipe forms. Difficulty is saved in PostgreSQL and displayed on the recipe detail page.
- Verified that the production frontend build completes successfully.

## Why

These changes make the recipe archive safer to deploy as a personal website and make recipe entries more useful. The shared password protects the archive without adding separate user accounts, and the Difficulty field helps me quickly choose a recipe that matches the time and effort I have.

## What broke or what I got stuck on

- My local Vite frontend port was already in use by an older development process. Windows would not let the current terminal stop that process, so I need to close the older terminal before starting the app again.
- I have not connected a cloud PostgreSQL database or added the production environment variables in Vercel yet. Because of that, I have not tested a live Vercel deployment.
- I decided not to keep Prep Time, Cook Time, and Servings after trying the feature. I removed them and kept only Difficulty so the recipe form stays simpler.

## What is left

- Create a cloud PostgreSQL database and add `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET` in Vercel before deploying.
- Deploy the app to Vercel and test sign-in, recipe saving, and the live site.
- Add automated tests for the login flow and recipe API.
- Continue improving recipe features, such as ingredient checklists or meal-planning tools.
