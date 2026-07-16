import { Heart } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { setLike, type LikeResource } from '../../api/likes'
import { useAuth } from '../../auth/useAuth'
import { getErrorMessage } from '../../utils/errors'
import styles from './LikeButton.module.css'

type LikeButtonProps = {
  resource: LikeResource
  resourceId: number
  initialCount: number
  compact?: boolean
}

export function LikeButton({
  resource,
  resourceId,
  initialCount,
  compact = false,
}: LikeButtonProps) {
  const {
    isAuthenticated,
    likedCommentIds,
    likedPostIds,
    token,
    updateLikedItem,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [count, setCount] = useState(initialCount)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const likedIds = resource === 'post' ? likedPostIds : likedCommentIds
  const isLiked = likedIds.includes(resourceId)
  const resourceLabel = resource === 'post' ? 'event' : 'comment'

  async function handleLike() {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setIsPending(true)
    setError(null)
    try {
      const result = await setLike(resource, resourceId, isLiked, token)
      updateLikedItem(resource, resourceId, !isLiked)
      setCount(result.like_count)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, `This ${resourceLabel} could not be updated.`))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <span className={`${styles.likeControl} ${compact ? styles.compact : ''}`}>
      <button
        type="button"
        aria-label={`${isLiked ? 'Unlike' : 'Like'} ${resourceLabel}`}
        aria-pressed={isLiked}
        disabled={isPending}
        onClick={handleLike}
      >
        <Heart size={compact ? 16 : 18} fill={isLiked ? 'currentColor' : 'none'} aria-hidden="true" />
        <span>{count}</span>
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </span>
  )
}
