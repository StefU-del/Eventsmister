import { useRef, type FormEvent } from 'react'
import { Globe2, LoaderCircle, MapPin, Search, Sparkles } from 'lucide-react'

import styles from './SearchIntro.module.css'

type SearchIntroProps = {
  query: string
  onQueryChange: (query: string) => void
  canSearchExternal: boolean
  isSearchingExternal: boolean
  onExternalSearch?: () => void
}

export function SearchIntro({
  query,
  onQueryChange,
  canSearchExternal,
  isSearchingExternal,
  onExternalSearch,
}: SearchIntroProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSearchExternal && !isSearchingExternal) {
      onExternalSearch?.()
    }
  }

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

      <form
        className={`${styles.searchPanel} ${onExternalSearch ? styles.hasExternalSearch : ''}`}
        role="search"
        onSubmit={handleSubmit}
      >
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
        {onExternalSearch && (
          <button
            className={styles.externalSearchButton}
            type="submit"
            disabled={!canSearchExternal || isSearchingExternal}
            title="Search connected event sources"
          >
            {isSearchingExternal ? (
              <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />
            ) : (
              <Globe2 size={17} aria-hidden="true" />
            )}
            {isSearchingExternal ? 'Searching' : 'Search wider'}
          </button>
        )}
      </form>
    </section>
  )
}
