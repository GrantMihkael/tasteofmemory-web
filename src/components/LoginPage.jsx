import { useState } from 'react'
import appLogo from '../../tasteofmemory logo.png'

function LoginPage({ onAuthenticated }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Unable to sign in.')
      onAuthenticated()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="login-page"><section className="login-card" aria-labelledby="login-title"><img src={appLogo} alt="A Taste of Memory" className="login-logo" /><span className="eyebrow">Private recipe archive</span><h1 id="login-title">Welcome back</h1><p>Enter the shared password to open the recipe box.</p><form onSubmit={submit}><label className="field"><span>Archive password</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="button button-dark" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Opening...' : 'Open recipe box'}</button></form></section></main>
}

export default LoginPage
