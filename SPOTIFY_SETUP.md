# Spotify setup

1. Sign in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. In the app settings, add this local development redirect URI:

   ```text
   http://127.0.0.1:5174/spotify-callback
   ```

   This project pins Vite to port `5174` for local development.

   When deploying, also add your live callback URL. For example:

   ```text
   https://your-domain.vercel.app/spotify-callback
   ```

   The redirect URI in Spotify's dashboard must exactly match `VITE_SPOTIFY_REDIRECT_URI` used by that deployed site.

3. Copy the app's Client ID. Do not use or expose the Client Secret.
4. Add the Client ID to the project-root `.env`:

   ```env
   VITE_SPOTIFY_CLIENT_ID=your_real_client_id
   ```

5. Restart `npm.cmd run dev` after changing `.env`.

## Deployment environment variables

In Vercel Project Settings > Environment Variables, set `DATABASE_URL` to the connection string for your hosted PostgreSQL database. Do not use a `localhost` address in deployment.

Set `APP_PASSWORD` and `SESSION_SECRET` as server-only variables. Never prefix them with `VITE_`, and never commit their real values. `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_REDIRECT_URI` are browser-visible by design; do not add a Spotify Client Secret to either variable.

The integration uses Authorization Code with PKCE. The access token stays in application memory; the refresh token is kept in session storage so the app can silently obtain a new short-lived access token during the current browser session.

Inline audio and playback controls require Spotify Premium. Non-Premium users receive playlist/track information and an **Open in Spotify** link.
