# Spotify setup

1. Sign in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. In the app settings, add this exact redirect URI:

   ```text
   http://127.0.0.1:5174/spotify-callback
   ```

   This project pins Vite to port `5174`, so keep this URI unchanged.

3. Copy the app's Client ID. Do not use or expose the Client Secret.
4. Add the Client ID to the project-root `.env`:

   ```env
   VITE_SPOTIFY_CLIENT_ID=your_real_client_id
   ```

5. Restart `npm.cmd run dev` after changing `.env`.

The integration uses Authorization Code with PKCE. The access token stays in application memory; the refresh token is kept in session storage so the app can silently obtain a new short-lived access token during the current browser session.

Inline audio and playback controls require Spotify Premium. Non-Premium users receive playlist/track information and an **Open in Spotify** link.
