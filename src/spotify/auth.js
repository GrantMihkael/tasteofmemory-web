// Add your Spotify app Client ID to VITE_SPOTIFY_CLIENT_ID in .env.
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify-callback`
const scopes = ['streaming', 'user-read-email', 'user-read-private', 'user-read-playback-state', 'user-modify-playback-state', 'playlist-read-private', 'user-library-read']
let accessToken = null
let expiresAt = 0

const encode = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const randomValue = () => encode(crypto.getRandomValues(new Uint8Array(64)))

export function spotifyIsConfigured() { return Boolean(clientId) }

export async function connectSpotify(returnPath) {
  if (!clientId) throw new Error('Add VITE_SPOTIFY_CLIENT_ID to your .env file first.')
  const verifier = randomValue()
  const state = randomValue().slice(0, 32)
  const challenge = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  sessionStorage.setItem('spotify_verifier', verifier)
  sessionStorage.setItem('spotify_state', state)
  sessionStorage.setItem('spotify_return_path', returnPath)
  const params = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri, scope: scopes.join(' '), code_challenge_method: 'S256', code_challenge: challenge, state })
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`)
}

export async function completeSpotifyLogin(code, state) {
  const verifier = sessionStorage.getItem('spotify_verifier')
  if (!verifier || state !== sessionStorage.getItem('spotify_state')) throw new Error('Spotify login could not be verified. Please try again.')
  const body = new URLSearchParams({ client_id: clientId, grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: verifier })
  const response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error('Spotify could not complete the login.')
  setTokens(await response.json())
  sessionStorage.removeItem('spotify_verifier')
  sessionStorage.removeItem('spotify_state')
  return sessionStorage.getItem('spotify_return_path') || '/'
}

function setTokens(tokens) {
  accessToken = tokens.access_token
  expiresAt = Date.now() + (tokens.expires_in - 60) * 1000
  if (tokens.refresh_token) sessionStorage.setItem('spotify_refresh_token', tokens.refresh_token)
}

export async function getSpotifyToken() {
  if (accessToken && Date.now() < expiresAt) return accessToken
  const refreshToken = sessionStorage.getItem('spotify_refresh_token')
  if (!refreshToken || !clientId) return null
  const body = new URLSearchParams({ client_id: clientId, grant_type: 'refresh_token', refresh_token: refreshToken })
  const response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) { disconnectSpotify(); return null }
  setTokens(await response.json())
  return accessToken
}

export function disconnectSpotify() {
  accessToken = null
  expiresAt = 0
  sessionStorage.removeItem('spotify_refresh_token')
}

export async function spotifyFetch(path, options = {}) {
  const token = await getSpotifyToken()
  if (!token) throw new Error('Connect Spotify to continue.')
  const response = await fetch(`https://api.spotify.com/v1${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers } })
  if (response.status === 204) return null
  if (!response.ok) throw new Error(`Spotify request failed (${response.status}).`)
  return response.json()
}
