import { useEffect, useState } from 'react'

import { getPosts, type Post } from '../api/posts'

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    getPosts(controller.signal)
      .then((loadedPosts) => {
        setPosts(loadedPosts)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setLoadError(
          error instanceof TypeError
            ? 'We could not reach the event service. Check that the backend is running and try again.'
            : error instanceof Error
              ? error.message
              : 'Events could not be loaded.',
        )
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [requestVersion])

  function retry() {
    setIsLoading(true)
    setLoadError(null)
    setRequestVersion((version) => version + 1)
  }

  return { posts, isLoading, loadError, retry }
}
