import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { AuthPanel } from '../components/auth/AuthPanel'
import { getErrorMessage } from '../utils/errors'
import styles from '../components/auth/AuthPanel.module.css'

type LoginLocationState = {
  from?: string
}

export function LoginPage() {
  const { isAuthenticated, isReady, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const destination = (location.state as LoginLocationState | null)?.from ?? '/'

  if (isReady && isAuthenticated) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await login({ username: username.trim(), password })
      navigate(destination, { replace: true })
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'You could not be logged in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPanel
      eyebrow="Welcome back"
      title="Your London plans are waiting."
      description="Log in to share events, join conversations, and keep track of what the community loves."
      footer={
        <>
          New here? <Link to="/register" state={{ from: destination }}>Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-username">
          Username
          <input
            id="login-username"
            autoComplete="username"
            value={username}
            maxLength={30}
            required
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label htmlFor="login-password">
          Password
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            maxLength={128}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in' : 'Log in'}
        </button>
      </form>
    </AuthPanel>
  )
}
