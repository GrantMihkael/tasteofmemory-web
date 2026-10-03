import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { completeSpotifyLogin } from '../spotify/auth'

function SpotifyCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) { setError(params.get('error') || 'Spotify did not return an authorization code.'); return }
    completeSpotifyLogin(code, params.get('state')).then((path) => navigate(path, { replace: true })).catch((loginError) => setError(loginError.message))
  }, [navigate])
  return <main className="spotify-callback" role="status"><h1>{error ? 'Spotify connection failed' : 'Connecting Spotify...'}</h1>{error && <><p>{error}</p><button className="button button-dark" type="button" onClick={() => navigate('/')}>Return home</button></>}</main>
}

export default SpotifyCallback
