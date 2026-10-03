# AI Usage

## Verified AI-assisted work

AI assistance was used on 2026-09-23 to inspect the existing React, Express, PostgreSQL, and Spotify code; create and update the project documentation; and verify the documented build and local API health steps.

AI assistance also helped add a shared-password login gate. The password is verified by the Express server and recipe endpoints use a signed, HTTP-only session cookie. No account table was added to PostgreSQL.

AI assistance did not receive, print, or commit the values stored in `.env`. The project owner chose and stored local credentials separately.

On 2026-09-23, AI assistance reviewed the responsive layout requirements for the 375px, 390px, and 428px mobile breakpoints, including the home screen, recipe detail, recipe form, Cook Mode, Spotify controls, pagination, and confirmation modal. The review identified the existing responsive CSS and began browser-based verification at a local development URL. AI assistance also updated shared hover and active affordances for clickable controls, including upload and dismiss controls, in `src/index.css`.


## Human responsibility

The project owner is responsible for reviewing generated text, testing the setup steps in their own environment, deciding which code changes to accept, and keeping this record current as AI is used in later work.
