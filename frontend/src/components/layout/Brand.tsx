import { Link } from 'react-router-dom'

import styles from './Brand.module.css'

export function Brand() {
  return (
    <Link className={styles.brand} to="/" aria-label="EventsMister home">
      <span className={styles.brandMark} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span>eventsmister</span>
    </Link>
  )
}
