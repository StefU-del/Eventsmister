import { RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { PageState } from '../components/common/PageState'
import { EventFilters } from '../components/events/EventFilters'
import { EventGrid } from '../components/events/EventGrid'
import { EventRecommendations } from '../components/events/EventRecommendations'
import { SearchIntro } from '../components/SearchIntro'
import { usePosts } from '../hooks/usePosts'
import { getRecommendedPosts } from '../utils/recommendations'
import pageStyles from './Page.module.css'
import styles from './DiscoverPage.module.css'

export function DiscoverPage() {
  const { posts, isLoading, loadError, retry } = usePosts()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const selectedHashtag = searchParams.get('tag')?.trim().toLowerCase() ?? ''

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((post) => post.category))).sort()],
    [posts],
  )

  const filteredPosts = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase()

    // Search remains client-side because the assignment-sized dataset arrives in one request.
    return posts
      .filter((post) => {
        const matchesCategory = category === 'All' || post.category === category
        const matchesHashtag = !selectedHashtag || post.hashtags.includes(selectedHashtag)
        const searchableText = `${post.title} ${post.description} ${post.category} ${post.location} ${post.owner.username} ${post.hashtags.join(' ')}`.toLowerCase()
        return matchesCategory && matchesHashtag && searchableText.includes(normalisedQuery)
      })
      .sort(
        (firstPost, secondPost) =>
          new Date(firstPost.event_date).getTime() - new Date(secondPost.event_date).getTime(),
      )
  }, [category, posts, query, selectedHashtag])

  const recommendations = useMemo(
    () => getRecommendedPosts(posts, user?.interests ?? []),
    [posts, user?.interests],
  )
  const showRecommendations =
    recommendations.length > 0 && !query.trim() && category === 'All' && !selectedHashtag

  function clearFilters() {
    setQuery('')
    setCategory('All')
    setSearchParams({})
  }

  return (
    <>
      <SearchIntro query={query} onQueryChange={setQuery} />
      {showRecommendations && <EventRecommendations posts={recommendations} />}
      <section className={`${pageStyles.page} ${styles.discovery}`} aria-labelledby="discover-title">
        <div className={styles.sectionHeading}>
          <div>
            <span>{selectedHashtag ? 'Hashtag' : 'Discover'}</span>
            <h1 id="discover-title">
              {selectedHashtag ? `#${selectedHashtag}` : 'Upcoming in London'}
            </h1>
          </div>
          {!isLoading && !loadError && posts.length > 0 && (
            <EventFilters
              categories={categories}
              selectedCategory={category}
              onCategoryChange={setCategory}
            />
          )}
        </div>

        {isLoading ? (
          <PageState kind="loading" title="Finding events" message="Gathering the latest posts from across London." />
        ) : loadError ? (
          <PageState
            kind="error"
            title="Events could not load"
            message={loadError}
            action={
              <button className={pageStyles.secondaryButton} type="button" onClick={retry}>
                <RefreshCw size={16} aria-hidden="true" />
                Try again
              </button>
            }
          />
        ) : posts.length === 0 ? (
          <PageState kind="empty" title="No events yet" message="New events will appear here as soon as they are posted." />
        ) : filteredPosts.length === 0 ? (
          <PageState
            kind="notFound"
            title="No matching events"
            message="Try another search or clear the category filter."
            action={
              <button className={pageStyles.secondaryButton} type="button" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EventGrid posts={filteredPosts} featureFirst />
        )}
      </section>
    </>
  )
}
