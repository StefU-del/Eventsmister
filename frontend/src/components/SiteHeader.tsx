import styles from './SiteHeader.module.css'

export function SiteHeader() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerInner}>
        <a className={styles.brand} href="#top" aria-label="EventsMister home">
          <span className={styles.brandMark} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>eventsmister</span>
        </a>

        <nav className={styles.navigation} aria-label="Main navigation">
          <a className={styles.activeNavItem} href="#discover">
            Discover
          </a>
          <a href="#upcoming">Upcoming</a>
        </nav>
      </div>
    </header>
  )
}
