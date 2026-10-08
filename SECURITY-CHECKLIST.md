# Security and privacy checklist

Completed: October 8, 2026  
Project: A Taste of Memory

This checklist documents the security and privacy review completed before final submission. It intentionally contains no real passwords, database URLs, tokens, or other secrets.

## Secrets and credentials

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` and `.env.local` are ignored by Git and are not tracked. | Yes | `.gitignore` excludes `.env` and `.env*`; `git ls-files` does not list either file. |
| 2 | A safe environment-variable template is committed. | Yes | `.env.example` contains placeholders only. |
| 3 | Server secrets are not hardcoded or exposed to browser code. | Yes | `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET` are read from server environment variables. No secret is prefixed with `VITE_`. |
| 4 | Spotify configuration follows the public-client model. | Yes | Only the Spotify Client ID and redirect URI use `VITE_`; no Spotify Client Secret is used or committed. |
| 5 | Production secrets are stored in the hosting provider's environment settings. | To verify before deployment | Configure `DATABASE_URL`, `APP_PASSWORD`, and `SESSION_SECRET` in Vercel Environment Variables; never commit their values. |
| 6 | Any credential exposed in Git history is rotated. | No exposure found in this review | Git history was searched for the configured secret variable names and only placeholders/documentation were found. Recheck before each push. |

## Access control and session security

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 7 | The archive has an app-level access gate. | Yes | `POST /api/login` checks the shared password on the server. |
| 8 | Recipe routes require a valid session. | Yes | `requireSession` protects `/api/recipes`, including create, update, and delete operations. |
| 9 | Session cookies are signed and protected from JavaScript access. | Yes | `backend/index.js` signs the session with HMAC and sets `HttpOnly` and `SameSite=Lax`. |
| 10 | Production cookies are sent only over HTTPS. | Yes | The cookie receives the `Secure` attribute when `NODE_ENV` or `VERCEL_ENV` is `production`. |
| 11 | Login attempts are rate-limited. | Yes | The login endpoint permits five attempts per IP address per 15 minutes. |
| 12 | Shared archive credentials are documented privately, not in this public repository. | To verify before submission | If the instructor requires the shared password in the private workspace, put it only in `project/README.md`, never here or in the public repository. |

## Database and API

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 13 | Database queries with request input use parameters. | Yes | Recipe queries use PostgreSQL placeholders such as `$1`, `$2`, and passed parameter arrays. |
| 14 | User input receives server-side validation. | Partial | Required recipe fields, categories, and difficulty are validated. Optional text, image size/type, and individual array-item contents should receive stricter validation in a future revision. |
| 15 | Browser output does not render user text as raw HTML. | Yes | Recipe content is rendered through React JSX; no raw HTML rendering API is used for recipe text. |
| 16 | Error responses avoid disclosing server internals. | Yes | The Express error handler returns a generic database error message. |
| 17 | Cross-origin access is not opened broadly. | Yes | The app does not enable wildcard CORS; frontend API calls use the same origin. |
| 18 | High-impact maintenance endpoints have been reviewed. | Needs decision | `DELETE /api/recipes` clears the entire archive after authentication. Keep it only if required and add an explicit UI confirmation; otherwise remove it before deployment. |
| 19 | The production database is not publicly open and uses least-privilege access. | To verify before deployment | Restrict database networking to the app/provider and use a database role with only the required permissions. |

## Repository and privacy

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 20 | Dependencies and source files do not include `node_modules`. | Yes | `node_modules/` is in `.gitignore`; packages are declared in `package.json` and lockfile. |
| 21 | Dependency vulnerabilities have been reviewed. | Needs update | `npm audit --omit=dev` reported vulnerabilities on October 8, 2026. Run `npm audit fix`, retest the app, and record the result before the final push. |
| 22 | Assets are owned, licensed, or credited. | To verify before submission | Review each image, sound, font, and logo; retain licenses or add attribution where needed. |
| 23 | The public repository contains no student number, home address, phone number, or personal email. | Needs attention | Review all tracked files and Git commit author metadata before the public submission. Do not add personal details to the repository. |
| 24 | Repository visibility is intentionally public for grading. | To verify before submission | Confirm the repository is public and that the workspace `project/README.md` links to it. |
| 25 | GitHub secret scanning and push protection are enabled. | To verify before submission | Check the repository's Security settings after it is published. |

## Final pre-push actions

- [ ] Run `npm audit fix`, then run `npm audit --omit=dev --audit-level=high` again.
- [ ] Confirm `git status` does not show `.env` or `.env.local`.
- [ ] Confirm real values exist only in local `.env` and Vercel environment settings.
- [ ] Review public files and Git history for personal data and accidental secrets.
- [ ] Verify database access rules and remove or protect the bulk-delete route if it is not needed.
- [ ] Confirm the GitHub repository is public and this file is visible at its root.
