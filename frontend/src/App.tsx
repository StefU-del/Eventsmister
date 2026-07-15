import { useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Heart,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react'

import jazzCourtyard from './assets/spring-jazz-courtyard.jpg'
import styles from './App.module.css'

type Event = {
  id: number
  title: string
  description: string
  category: 'Music' | 'Arts' | 'Food' | 'Outdoors'
  location: string
  day: string
  month: string
  time: string
  image?: string
  accent: 'mint' | 'coral' | 'yellow' | 'sky'
}

const events: Event[] = [
  {
    id: 1,
    title: 'Jazz in the Courtyard',
    description:
      'An easy-going afternoon of live jazz, good food, and new faces in a hidden East London courtyard.',
    category: 'Music',
    location: 'Shoreditch, London',
    day: '18',
    month: 'Jul',
    time: '3:00 PM',
    image: jazzCourtyard,
    accent: 'mint',
  },
  {
    id: 2,
    title: 'Hackney Pottery Social',
    description: 'A relaxed hand-building workshop for curious beginners.',
    category: 'Arts',
    location: 'Hackney Wick',
    day: '20',
    month: 'Jul',
    time: '6:30 PM',
    accent: 'coral',
  },
  {
    id: 3,
    title: 'Riverside Run & Coffee',
    description: 'A friendly 5K followed by coffee beside the Thames.',
    category: 'Outdoors',
    location: 'Battersea Park',
    day: '23',
    month: 'Jul',
    time: '9:00 AM',
    accent: 'sky',
  },
  {
    id: 4,
    title: 'Peckham Supper Club',
    description: 'Seasonal sharing plates around one long neighbourhood table.',
    category: 'Food',
    location: 'Peckham Rye',
    day: '26',
    month: 'Jul',
    time: '7:00 PM',
    accent: 'yellow',
  },
]

const categories = ['All', 'Music', 'Arts', 'Food', 'Outdoors'] as const
type Category = (typeof categories)[number]

function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [savedEventIds, setSavedEventIds] = useState<number[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredEvents = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()

    return events.filter((event) => {
      const matchesCategory = category === 'All' || event.category === category
      const searchableText = `${event.title} ${event.description} ${event.location}`.toLowerCase()
      const matchesQuery = searchableText.includes(normalisedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  const featuredEvent = filteredEvents.find((event) => event.image)
  const upcomingEvents = filteredEvents.filter((event) => event.id !== featuredEvent?.id)

  function toggleSaved(eventId: number) {
    setSavedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    )
  }

  function focusSearch() {
    searchInputRef.current?.focus()
  }

  return (
    <div className={styles.appShell}>
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

      <main id="top">
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
            <button className={styles.browseButton} type="button" onClick={focusSearch}>
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
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className={styles.searchLocation} aria-label="Search location: London">
              <MapPin size={17} aria-hidden="true" />
              <span>London</span>
            </div>
          </div>
        </section>

        <section className={styles.discovery} id="discover" aria-labelledby="discover-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.sectionKicker}>This week</span>
              <h2 id="discover-title">Fresh picks near you</h2>
            </div>
            <div className={styles.categoryFilters} aria-label="Filter events by category">
              {categories.map((item) => (
                <button
                  className={category === item ? styles.activeFilter : undefined}
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={24} aria-hidden="true" />
              <h3>No events found</h3>
              <p>Try another search or clear the category filter.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className={styles.eventLayout}>
              {featuredEvent && (
                <article className={styles.featuredCard}>
                  <div className={styles.featuredMedia}>
                    <img src={featuredEvent.image} alt="A live jazz trio playing in a leafy London courtyard" />
                    <span className={styles.categoryBadge}>{featuredEvent.category}</span>
                    <button
                      className={styles.saveButton}
                      type="button"
                      aria-label={
                        savedEventIds.includes(featuredEvent.id)
                          ? `Remove ${featuredEvent.title} from saved events`
                          : `Save ${featuredEvent.title}`
                      }
                      title={savedEventIds.includes(featuredEvent.id) ? 'Remove from saved' : 'Save event'}
                      aria-pressed={savedEventIds.includes(featuredEvent.id)}
                      onClick={() => toggleSaved(featuredEvent.id)}
                    >
                      <Heart
                        size={19}
                        fill={savedEventIds.includes(featuredEvent.id) ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  <div className={styles.featuredBody}>
                    <div className={styles.dateBlock}>
                      <span>{featuredEvent.month}</span>
                      <strong>{featuredEvent.day}</strong>
                    </div>
                    <div className={styles.eventCopy}>
                      <div className={styles.eventMeta}>
                        <span>
                          <CalendarDays size={15} aria-hidden="true" />
                          {featuredEvent.time}
                        </span>
                        <span>
                          <MapPin size={15} aria-hidden="true" />
                          {featuredEvent.location}
                        </span>
                      </div>
                      <h3>{featuredEvent.title}</h3>
                      <p>{featuredEvent.description}</p>
                    </div>
                  </div>
                </article>
              )}

              <div className={styles.upcomingPanel} id="upcoming">
                <div className={styles.upcomingHeading}>
                  <h3>Coming up</h3>
                  <span>{upcomingEvents.length} events</span>
                </div>
                <div className={styles.upcomingList}>
                  {upcomingEvents.map((event) => {
                    const isSaved = savedEventIds.includes(event.id)

                    return (
                      <article className={styles.upcomingCard} key={event.id}>
                        <div className={`${styles.smallDate} ${styles[event.accent]}`}>
                          <span>{event.month}</span>
                          <strong>{event.day}</strong>
                        </div>
                        <div className={styles.upcomingCopy}>
                          <span className={styles.smallCategory}>{event.category}</span>
                          <h4>{event.title}</h4>
                          <p>
                            {event.time} · {event.location}
                          </p>
                        </div>
                        <button
                          className={styles.listSaveButton}
                          type="button"
                          aria-label={isSaved ? `Remove ${event.title} from saved events` : `Save ${event.title}`}
                          title={isSaved ? 'Remove from saved' : 'Save event'}
                          aria-pressed={isSaved}
                          onClick={() => toggleSaved(event.id)}
                        >
                          <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
                        </button>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <span>eventsmister</span>
        <p>Making London feel a little smaller.</p>
      </footer>
    </div>
  )
}

export default App
