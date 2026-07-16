import { Heart, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getHeartedPosts, type Post } from '../api/posts'
import { useAuth } from '../auth/useAuth'
import { PageHeader } from '../components/common/PageHeader'
import { PageState } from '../components/common/PageState'
import { EventGrid } from '../components/events/EventGrid'
import { getErrorMessage } from '../utils/errors'
import pageStyles from './Page.module.css'
import styles from './HeartedEventsPage.module.css'

export function HeartedEventsPage() {
  const { likedPostIds, token } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    if (!token) {
      return
    }

    const controller = new AbortController()
    getHeartedPosts(token, controller.signal)
      .then((loadedPosts) => {
        setPosts(loadedPosts)
        setIsLoading(false)
      })
      .catch((caughtError: unknown) => {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
          return
        }
        setError(getErrorMessage(caughtError, 'Your hearted events could not be loaded.'))
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [requestVersion, token])

  // Session like state updates immediately, so unhearted cards disappear without refetching.
  const visiblePosts = useMemo(
    () => posts.filter((post) => likedPostIds.includes(post.id)),
    [likedPostIds, posts],
  )

  function retry() {
    setError(null)
    setIsLoading(true)
    setRequestVersion((version) => version + 1)
  }

  return (
    <section className={pageStyles.page}>
      <PageHeader
        eyebrow="Your shortlist"
        title="Hearted events"
        description="The events you have hearted, together in one place."
        action={
          <span
            className={styles.count}
            aria-label={`${visiblePosts.length} hearted ${visiblePosts.length === 1 ? 'event' : 'events'}`}
          >
            <Heart size={16} fill="currentColor" aria-hidden="true" />
            {visiblePosts.length}
          </span>
        }
      />

      {isLoading ? (
        <PageState kind="loading" title="Loading hearted events" />
      ) : error ? (
        <PageState
          kind="error"
          title="Hearted events could not load"
          message={error}
          action={
            <button className={pageStyles.secondaryButton} type="button" onClick={retry}>
              <RefreshCw size={16} aria-hidden="true" />
              Try again
            </button>
          }
        />
      ) : visiblePosts.length === 0 ? (
        <PageState
          kind="empty"
          title="No hearted events yet"
          message="Heart an event while browsing and it will appear here."
          action={<Link className={pageStyles.primaryLink} to="/">Discover events</Link>}
        />
      ) : (
        <EventGrid posts={visiblePosts} featureFirst />
      )}
    </section>
  )
}
