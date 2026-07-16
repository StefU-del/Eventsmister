import { useMemo, useState } from 'react'

import { EventFeed } from '../components/EventFeed'
import { EventFilters } from '../components/EventFilters'
import { EventStatus } from '../components/EventStatus'
import { SearchIntro } from '../components/SearchIntro'
import { usePosts } from '../hooks/usePosts'
import styles from './DiscoverPage.module.css'

export function DiscoverPage() {
  const { posts, isLoading, loadError, retry } = usePosts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [savedEventIds, setSavedEventIds] = useState<number[]>([])

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((post) => post.category))).sort()],
    [posts],
  )

  const filteredPosts = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()

    return posts
      .filter((post) => {
        const matchesCategory = category === 'All' || post.category === category
        const searchableText = `${post.title} ${post.description} ${post.category} ${post.location}`.toLowerCase()

        return matchesCategory && searchableText.includes(normalisedQuery)
      })
      .sort(
        (firstPost, secondPost) =>
          new Date(firstPost.event_date).getTime() - new Date(secondPost.event_date).getTime(),
      )
  }, [category, posts, query])

  function toggleSaved(postId: number) {
    setSavedEventIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    )
  }

  function clearFilters() {
    setQuery('')
    setCategory('All')
  }

  let content

  if (isLoading) {
    content = <EventStatus kind="loading" />
  } else if (loadError) {
    content = <EventStatus kind="error" message={loadError} onAction={retry} />
  } else if (posts.length === 0) {
    content = <EventStatus kind="empty" />
  } else if (filteredPosts.length === 0) {
    content = <EventStatus kind="noMatches" onAction={clearFilters} />
  } else {
    content = (
      <EventFeed
        posts={filteredPosts}
        savedEventIds={savedEventIds}
        onToggleSaved={toggleSaved}
      />
    )
  }

  return (
    <>
      <SearchIntro query={query} onQueryChange={setQuery} />
      <section className={styles.discovery} id="discover" aria-labelledby="discover-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionKicker}>Discover</span>
            <h2 id="discover-title">Upcoming in London</h2>
          </div>
          {!isLoading && !loadError && posts.length > 0 && (
            <EventFilters
              categories={categories}
              selectedCategory={category}
              onCategoryChange={setCategory}
            />
          )}
        </div>
        {content}
      </section>
    </>
  )
}
