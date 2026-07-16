import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { AuthPanel } from '../components/auth/AuthPanel'
import panelStyles from '../components/auth/AuthPanel.module.css'
import { getErrorMessage } from '../utils/errors'

type RegisterLocationState = {
  from?: string
}

export function RegisterPage() {
  const { isAuthenticated, isReady, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const destination = (location.state as RegisterLocationState | null)?.from ?? '/'

  if (isReady && isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await register({ username: username.trim(), email: email.trim(), password })
      navigate(destination, { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Your account could not be created.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPanel
      eyebrow="Join the community"
      title="Make more of London."
      description="Create an account to share useful finds and meet people around the events you already enjoy."
      footer={
        <>
          Already a member? <Link to="/login" state={{ from: destination }}>Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="register-username">
          Username
          <input
            id="register-username"
            autoComplete="username"
            value={username}
            minLength={3}
            maxLength={30}
            pattern="[A-Za-z0-9_]+"
            required
            onChange={(event) => setUsername(event.target.value)}
          />
          <small>Letters, numbers, and underscores.</small>
        </label>
        <label htmlFor="register-email">
          Email
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            maxLength={50}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label htmlFor="register-password">
          Password
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            minLength={8}
            maxLength={128}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          <small>Use uppercase, lowercase, a number, and a symbol.</small>
        </label>
        {error && <p className={panelStyles.formError} role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account' : 'Create account'}
        </button>
      </form>
    </AuthPanel>
  )
}
