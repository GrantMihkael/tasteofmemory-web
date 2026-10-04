# AI Usage Record

This document records how AI assistance was used while building A Taste of Memory. I used AI heavily for review, UI refinement, debugging, and documentation, but I reviewed the output and made the final decisions about what to keep.

## 1. How I used AI

### 1. Project structure and local setup

- **Date and tool:** 2026-09-23 — OpenAI Codex
- **What I asked:** I asked for help reviewing the React, Express, PostgreSQL, and Spotify project structure and checking the local setup steps.
- **What AI returned:** It identified the frontend/backend responsibilities, environment variables, and the local API/database setup requirements.
- **What I kept or changed:** I kept the setup guidance but reviewed it against my own project files and environment. I kept the architecture because it separates the React interface, Express API, and PostgreSQL data layer clearly.
- **Commit:** [Initial project commit](https://github.com/GrantMihkael/tasteofmemory-web/commit/2bc1afc)

### 2. Login and session review

- **Date and tool:** 2026-09-23 — OpenAI Codex
- **What I asked:** I asked for a security review of a shared-password login flow for a private recipe archive.
- **What AI returned:** It suggested server-side password verification, signed HTTP-only session cookies, and keeping secrets in `.env` instead of frontend code.
- **What I kept or changed:** I kept the security principles. I wrote and reviewed the login/session implementation in `backend/index.js` and the login interface in `src/components/LoginPage.jsx` so the project would not expose the password in the browser.
- **Commit:** [Initial project commit](https://github.com/GrantMihkael/tasteofmemory-web/commit/2bc1afc)

### 3. Recipe archive UI review

- **Date and tool:** 2026-10-04 — OpenAI Codex with Impeccable
- **What I asked:** I asked for a critique of the recipe archive’s spacing, hierarchy, typography, mobile layout, and accessibility.
- **What AI returned:** It identified issues with the oversized homepage hero, duplicated actions, mobile spacing, and recipe-detail action hierarchy.
- **What I kept or changed:** I kept the warm editorial recipe-archive style, but used the feedback to tighten spacing, improve focus states, organize secondary actions, and make the archive easier to scan.
- **Commit:** [UI and UX improvements](https://github.com/GrantMihkael/tasteofmemory-web/commit/bb5c0cb)

### 4. Responsive interface review

- **Date and tool:** 2026-09-23 — OpenAI Codex
- **What I asked:** I asked for help checking the home page, recipe detail, form, Cook Mode, Spotify controls, pagination, and confirmations at small mobile widths.
- **What AI returned:** It suggested responsive breakpoints, larger touch targets, horizontal filter handling, and reduced-motion support.
- **What I kept or changed:** I kept the mobile-first improvements that fit the app and reviewed the CSS against the existing design before accepting them.
- **Commit:** [UI and UX improvements](https://github.com/GrantMihkael/tasteofmemory-web/commit/bb5c0cb)

### 5. Spotify interface polish

- **Date and tool:** 2026-10-04 — OpenAI Codex with Impeccable
- **What I asked:** I asked for help making the Spotify controls fit inside Cook Mode without taking attention away from the current recipe step.
- **What AI returned:** It proposed a compact music dock, responsive control sizing, and fallback-aware messaging.
- **What I kept or changed:** I kept Spotify as an optional cooking companion rather than removing the feature. I reviewed the layout changes to keep the recipe step as the primary task.
- **Commit:** [UI and UX improvements](https://github.com/GrantMihkael/tasteofmemory-web/commit/bb5c0cb)

### 6. Environment and deployment documentation

- **Date and tool:** 2026-10-03 — OpenAI Codex
- **What I asked:** I asked for help documenting local development and the environment variables needed for a Vercel deployment.
- **What AI returned:** It described the role of `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`, and Spotify configuration variables.
- **What I kept or changed:** I kept the documentation after checking that it matched the project’s `.env.example`, Vite proxy, and Express server configuration. I did not include real secrets in the repository.
- **Commit:** [Environment and production settings](https://github.com/GrantMihkael/tasteofmemory-web/commit/6461047)

## 2. Where the AI got it wrong

### 1. Removing Spotify from Cook Mode

- **What AI gave me:** During UI simplification, AI treated Spotify as a distraction and hid it from Cook Mode.
- **What was wrong:** Spotify is an intended product feature and part of the kitchen atmosphere, so removing it changed the product rather than simplifying it.
- **What I did instead:** I restored Spotify and kept it visually secondary to the recipe instructions.
- **Commit:** [UI and UX improvements](https://github.com/GrantMihkael/tasteofmemory-web/commit/bb5c0cb)

### 2. Hiding Surprise Me as if it duplicated Add Recipe

- **What AI gave me:** AI initially hid the Surprise Me action while trying to reduce repeated calls to action.
- **What was wrong:** Surprise Me is a discovery feature, while Add Recipe creates content; they are different user tasks.
- **What I did instead:** I kept Add Recipe as the main archive action and restored Surprise Me as a secondary discovery action.
- **Commit:** [UI and UX improvements](https://github.com/GrantMihkael/tasteofmemory-web/commit/bb5c0cb)

### 3. A mobile Surprise Me card that could overflow

- **What AI gave me:** The reveal card used a `90vw` width and was then enlarged with a scale transform.
- **What was wrong:** At narrow phone widths, the scaled card plus overlay padding could exceed the viewport and clip the animation.
- **What I did instead:** I limited the card width, removed the mobile scene scale, reduced the shadow/transition, and retained reduced-motion support.
- **Commit:** [Mobile Surprise Me fix](https://github.com/GrantMihkael/tasteofmemory-web/commit/c890c64)

## 3. Who wrote what

### My contributions

#### PostgreSQL schema and data model

- **File:** `backend/schema.sql`
- **Commit:** [Initial project commit](https://github.com/GrantMihkael/tasteofmemory-web/commit/2bc1afc)
- **What it does and why:** I wrote the schema that stores recipes in PostgreSQL. It defines the recipe fields and the database structure needed by the application, so the API can save and retrieve the same data that the React interface collects.

#### Spotify integration

- **Files:** `src/spotify/auth.js`, `src/components/SpotifyPlayer.jsx`, `src/components/SpotifyCallback.jsx`
- **Commit:** [Initial project commit](https://github.com/GrantMihkael/tasteofmemory-web/commit/2bc1afc)
- **What it does and why:** I implemented the Spotify connection flow and player interface so Cook Mode can optionally play music. I used a browser-based OAuth/PKCE flow because Spotify tokens should not be hard-coded into the project.

#### Login and session handling

- **Files:** `backend/index.js`, `src/components/LoginPage.jsx`
- **Commit:** [Initial project commit](https://github.com/GrantMihkael/tasteofmemory-web/commit/2bc1afc)
- **What it does and why:** I built a shared-password login flow for a private archive. The server checks the password and sends a signed HTTP-only cookie, which means the password is not stored in the React app.

#### Backend recipe routes

- **File:** `backend/routes/recipes.js`
- **Commit:** [Initial project commit](https://github.com/GrantMihkael/tasteofmemory-web/commit/2bc1afc)
- **What it does and why:** I wrote the API routes that create, read, update, and delete recipes. These routes validate incoming data before it is saved, which keeps the database consistent with the recipe form.

#### Core UI and design decisions

- **Files:** `src/App.jsx`, `src/components/`, `src/index.css`
- **Commit:** [UI and UX improvements](https://github.com/GrantMihkael/tasteofmemory-web/commit/bb5c0cb)
- **What it does and why:** I designed the warm recipe-archive identity, chose the cooking workflow, and reviewed the UI changes so that browsing recipes, adding content, and Cook Mode remain the main tasks.

### AI-written code I understand best

#### Responsive Surprise Me styling

- **File:** `src/index.css`
- **Commit:** [Mobile Surprise Me fix](https://github.com/GrantMihkael/tasteofmemory-web/commit/c890c64)
- **What it does and why it was kept:** The CSS uses a fixed overlay and a 3D card transform to reveal a randomly selected recipe. On mobile, the card width is constrained with `min()` and `max-width` so it fits within the viewport. The `prefers-reduced-motion` media query removes the animated transition for people who request less motion. I understand that the random recipe is selected in `App.jsx`, while the CSS controls only the presentation.

## Review statement

I reviewed this record and confirmed that it reflects my actual use of AI. I will update it if I use AI for future changes.
