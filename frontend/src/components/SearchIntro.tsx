import { useRef } from 'react'
import { MapPin, Search, Sparkles } from 'lucide-react'

import styles from './SearchIntro.module.css'

type SearchIntroProps = {
  query: string
  onQueryChange: (query: string) => void
}

export function SearchIntro({ query, onQueryChange }: SearchIntroProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <section className={styles.intro} aria-labelledby="page-title">
      <div className={styles.eyebrow}>
        <Sparkles size={16} aria-hidden="true" />
        <span>Made for curious Londoners</span>
      </div>
      <div className={styles.introHeading}>
        <div>
          <h1 id="page-title">Find your next London thing.</h1>
          <p>Local events, good people, no endless scrolling.</p>
        </div>
        <button
          className={styles.browseButton}
          type="button"
          onClick={() => searchInputRef.current?.focus()}
        >
          Browse events
        </button>
      </div>

      <div className={styles.searchPanel} role="search">
        <Search size={20} aria-hidden="true" />
        <label className={styles.visuallyHidden} htmlFor="event-search">
          Search events
        </label>
        <input
          ref={searchInputRef}
          id="event-search"
          type="search"
          placeholder="Search music, food, workshops..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <div className={styles.searchLocation} aria-label="Search location: London">
          <MapPin size={17} aria-hidden="true" />
          <span>London</span>
        </div>
      </div>
    </section>
  )
}
