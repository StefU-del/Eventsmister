import { Link } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  const { isAuthenticated } = useAuth()

  return (
    <footer className={styles.footer}>
      <Link to="/">eventsmister</Link>
      <p>Making London feel a little smaller.</p>
      <nav aria-label="Footer navigation">
        {isAuthenticated && (
          <>
            <Link to="/hearted">Hearted events</Link>
            <Link to="/people">Find people</Link>
          </>
        )}
        <Link to="/events/new">Share an event</Link>
      </nav>
    </footer>
  )
}
