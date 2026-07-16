import { Heart, LogOut, Menu, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../auth/useAuth'
import { ProfileAvatar } from '../users/ProfileAvatar'
import styles from './SiteHeader.module.css'
import { Brand } from './Brand'

export function SiteHeader() {
  const { isAuthenticated, isReady, logout, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const logoutPendingRef = useRef(false)

  useEffect(() => {
    if (!logoutPendingRef.current || location.pathname !== '/') {
      return
    }

    // Clear auth only after home is committed so protected guards are already unmounted.
    logoutPendingRef.current = false
    logout()
  }, [location.pathname, logout])

  function closeMenu() {
    setIsMenuOpen(false)
  }

  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <Brand />

        <button
          className={styles.menuButton}
          type="button"
          aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMenuOpen}
          aria-controls="main-navigation"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <div
          className={`${styles.navigationWrap} ${isMenuOpen ? styles.menuOpen : ''}`}
          id="main-navigation"
        >
          <nav className={styles.navigation} aria-label="Main navigation">
            <NavLink
              className={({ isActive }) => (isActive ? styles.activeNavItem : undefined)}
              to="/"
              end
              onClick={closeMenu}
            >
              Discover
            </NavLink>
            {isReady && isAuthenticated && (
              <>
                <NavLink
                  className={({ isActive }) => (isActive ? styles.activeNavItem : undefined)}
                  to="/hearted"
                  onClick={closeMenu}
                >
                  <Heart size={15} aria-hidden="true" />
                  Hearted
                </NavLink>
                <NavLink
                  className={({ isActive }) => (isActive ? styles.activeNavItem : undefined)}
                  to="/people"
                  onClick={closeMenu}
                >
                  People
                </NavLink>
              </>
            )}
          </nav>

          <div className={styles.accountActions}>
            {isReady && isAuthenticated && user ? (
              <>
                <Link className={styles.createLink} to="/events/new" onClick={closeMenu}>
                  <Plus size={17} aria-hidden="true" />
                  Create event
                </Link>
                <Link
                  className={styles.profileLink}
                  to={`/users/${user.id}`}
                  onClick={closeMenu}
                >
                  <ProfileAvatar
                    username={user.username}
                    photoUrl={user.profile_photo_url}
                    size="small"
                    decorative
                  />
                  {user.username}
                </Link>
                <button
                  className={styles.logoutButton}
                  type="button"
                  title="Log out"
                  aria-label="Log out"
                  onClick={() => {
                    closeMenu()
                    if (location.pathname === '/') {
                      logout()
                      return
                    }
                    logoutPendingRef.current = true
                    navigate('/', { replace: true })
                  }}
                >
                  <LogOut size={18} aria-hidden="true" />
                </button>
              </>
            ) : isReady ? (
              <>
                <Link className={styles.loginLink} to="/login" onClick={closeMenu}>
                  Log in
                </Link>
                <Link className={styles.joinLink} to="/register" onClick={closeMenu}>
                  Join EventsMister
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}
