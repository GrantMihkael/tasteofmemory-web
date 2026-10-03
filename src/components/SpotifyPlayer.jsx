import { ExternalLink, Pause, Play, Search, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { connectSpotify, getSpotifyToken, spotifyFetch, spotifyIsConfigured } from '../spotify/auth'

let sdkPromise
function loadSpotifySdk() {
  if (window.Spotify) return Promise.resolve()
  if (!sdkPromise) sdkPromise = new Promise((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = resolve
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  })
  return sdkPromise
}

function formatPlaybackTime(milliseconds = 0) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function SpotifyPlayer({ returnPath }) {
  const playerRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [premium, setPremium] = useState(false)
  const [track, setTrack] = useState(null)
  const [paused, setPaused] = useState(true)
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [deviceId, setDeviceId] = useState('')
  const [volume, setVolume] = useState(0.65)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const previousVolumeRef = useRef(0.65)

  useEffect(() => {
    let active = true
    let player
    async function setup() {
      const token = await getSpotifyToken()
      if (!token || !active) return
      setConnected(true)
      const [profile, playlistData, current] = await Promise.all([
        spotifyFetch('/me'),
        spotifyFetch('/me/playlists?limit=20'),
        spotifyFetch('/me/player/currently-playing').catch(() => null),
      ])
      if (!active) return
      setPremium(profile.product === 'premium')
      setPlaylists(playlistData?.items || [])
      setTrack(current?.item || null)
      setPaused(!current?.is_playing)
      setPosition(current?.progress_ms || 0)
      setDuration(current?.item?.duration_ms || 0)
      if (profile.product !== 'premium') return
      await loadSpotifySdk()
      if (!active) return
      player = new window.Spotify.Player({ name: 'A Taste of Memory Kitchen', getOAuthToken: async (callback) => callback(await getSpotifyToken()), volume: 0.65 })
      playerRef.current = player
      player.addListener('ready', ({ device_id }) => setDeviceId(device_id))
      player.addListener('player_state_changed', (state) => {
        if (state) {
          setTrack(state.track_window.current_track)
          setPaused(state.paused)
          setPosition(state.position || 0)
          setDuration(state.duration || state.track_window.current_track?.duration_ms || 0)
        }
      })
      player.addListener('account_error', () => { setPremium(false); setError('Inline playback requires Spotify Premium.') })
      player.addListener('authentication_error', ({ message }) => setError(message))
      player.addListener('initialization_error', ({ message }) => setError(message))
      await player.connect()
    }
    setup().catch((setupError) => setError(setupError.message))
    return () => { active = false; if (player) player.disconnect() }
  }, [])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!connected || query.length < 2) { setSearchResults([]); setIsSearching(false); return undefined }
    let active = true
    setIsSearching(true)
    const timer = window.setTimeout(() => {
      spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track&limit=5`)
        .then((data) => { if (active) setSearchResults(data?.tracks?.items || []) })
        .catch((searchError) => { if (active) { setSearchResults([]); setError(searchError.message) } })
        .finally(() => { if (active) setIsSearching(false) })
    }, 350)
    return () => { active = false; window.clearTimeout(timer) }
  }, [connected, searchQuery])

  useEffect(() => {
    if (paused || !duration) return undefined
    const timer = window.setInterval(() => {
      setPosition((currentPosition) => Math.min(duration, currentPosition + 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [duration, paused])

  const choosePlaylist = async (uri) => {
    setSelectedPlaylist(uri)
    setSearchOpen(false)
    setSearchQuery('')
    if (!premium || !deviceId || !uri) return
    try {
      await spotifyFetch('/me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [deviceId], play: false }) })
      await spotifyFetch(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: 'PUT', body: JSON.stringify({ context_uri: uri }) })
    } catch (playError) { setError(playError.message) }
  }

  const chooseTrack = async (selectedTrack) => {
    setTrack(selectedTrack)
    setPosition(0)
    setDuration(selectedTrack.duration_ms || 0)
    setSelectedPlaylist('')
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
    if (!premium || !deviceId) return
    try {
      await spotifyFetch('/me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [deviceId], play: false }) })
      await spotifyFetch(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: 'PUT', body: JSON.stringify({ uris: [selectedTrack.uri] }) })
    } catch (playError) { setError(playError.message) }
  }

  const changeVolume = async (value) => {
    const nextVolume = Number(value)
    setVolume(nextVolume)
    if (nextVolume > 0) previousVolumeRef.current = nextVolume
    try { await playerRef.current?.setVolume(nextVolume) } catch { setError('Volume could not be changed.') }
  }
  const toggleMute = () => changeVolume(volume === 0 ? previousVolumeRef.current || 0.65 : 0)

  const seekTrack = async (value) => {
    const nextPosition = Number(value)
    setPosition(nextPosition)
    try { await playerRef.current?.seek(nextPosition) } catch { setError('Playback position could not be changed.') }
  }

  if (!connected) return <div className="spotify-connect"><div><strong>Music for the kitchen</strong><span>{spotifyIsConfigured() ? 'Connect Spotify to play a saved playlist.' : 'Add your Spotify Client ID to enable playback.'}</span></div><button className="spotify-button" type="button" disabled={!spotifyIsConfigured()} onClick={() => connectSpotify(returnPath).catch((connectError) => setError(connectError.message))}>Connect Spotify</button>{error && <span className="spotify-error" role="alert">{error}</span>}</div>

  const selectedPlaylistData = playlists.find((item) => item.uri === selectedPlaylist)
  const externalUrl = track?.external_urls?.spotify || selectedPlaylistData?.external_urls?.spotify || 'https://open.spotify.com/'
  const displayName = track?.name || selectedPlaylistData?.name || 'Choose a playlist'
  const displaySubtitle = track?.artists?.map((artist) => artist.name).join(', ') || (selectedPlaylistData ? 'Selected playlist' : 'Select music to begin')
  const progressPercent = duration ? Math.min(100, (position / duration) * 100) : 0
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  return <div className="spotify-player" aria-label="Spotify playback">
    <div className="spotify-track">{track?.album?.images?.[2]?.url ? <img src={track.album.images[2].url} alt="" /> : selectedPlaylistData?.images?.at(-1)?.url ? <img src={selectedPlaylistData.images.at(-1).url} alt="" /> : <span className="album-placeholder">♪</span>}<div><strong>{displayName}</strong><span>{displaySubtitle}</span></div></div>
    <div className="spotify-picker" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false) }}><span className="spotify-picker-label">Find something to play</span><div className="spotify-search"><Search size={18} aria-hidden="true" /><input type="search" value={searchQuery} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true) }} placeholder="Search songs or playlists" aria-label="Search Spotify songs or choose a saved playlist" aria-expanded={searchOpen} aria-controls="spotify-music-options" />{searchOpen && <div className="spotify-search-results" id="spotify-music-options" aria-live="polite">{searchQuery.trim().length >= 2 ? isSearching ? <span className="spotify-search-status">Searching...</span> : searchResults.length ? searchResults.map((result) => <button type="button" key={result.id} onClick={() => chooseTrack(result)}><span>{result.name}</span><small>{result.artists.map((artist) => artist.name).join(', ')}</small></button>) : <span className="spotify-search-status">No songs found.</span> : <><span className="spotify-search-heading">Saved playlists</span>{playlists.length ? playlists.map((playlist) => <button type="button" key={playlist.id} onClick={() => choosePlaylist(playlist.uri)}><span>{playlist.name}</span><small>Playlist</small></button>) : <span className="spotify-search-status">No saved playlists found.</span>}</>}</div>}</div></div>
    {premium ? <><div className="spotify-playback"><div className="spotify-controls"><button type="button" onClick={() => playerRef.current?.previousTrack()} aria-label="Previous track"><SkipBack /></button><button className="spotify-play" type="button" onClick={() => playerRef.current?.togglePlay()} aria-label={paused ? 'Play' : 'Pause'}>{paused ? <Play /> : <Pause />}</button><button type="button" onClick={() => playerRef.current?.nextTrack()} aria-label="Next track"><SkipForward /></button></div><div className="spotify-progress"><span>{formatPlaybackTime(position)}</span><input type="range" min="0" max={Math.max(duration, 1)} step="1000" value={Math.min(position, Math.max(duration, 1))} onChange={(event) => seekTrack(event.target.value)} aria-label="Song progress" style={{ '--progress': `${progressPercent}%` }} /><span>{formatPlaybackTime(duration)}</span></div></div><div className="spotify-volume"><button type="button" onClick={toggleMute} aria-label={volume === 0 ? 'Unmute' : 'Mute'}><VolumeIcon /></button><input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(event.target.value)} aria-label="Spotify volume" style={{ '--volume': `${volume * 100}%` }} /></div></> : <><div className="spotify-playback spotify-playback-fallback"><span>Playback opens in Spotify</span></div><a className="spotify-open" href={externalUrl} target="_blank" rel="noreferrer">Open in Spotify <ExternalLink size={16} /></a></>}
    {error && <span className="spotify-error" role="alert">{error}</span>}
  </div>
}

export default SpotifyPlayer
