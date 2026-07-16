import { Trash2 } from 'lucide-react'

import { LikeButton } from './LikeButton'
import styles from './EventActions.module.css'

type EventActionsProps = {
  postId: number
  initialLikeCount: number
  isOwner: boolean
  isDeleting: boolean
  error: string | null
  onDelete: () => void
}

export function EventActions({
  postId,
  initialLikeCount,
  isOwner,
  isDeleting,
  error,
  onDelete,
}: EventActionsProps) {
  return (
    <aside className={styles.panel} aria-label="Event actions">
      <LikeButton resource="post" resourceId={postId} initialCount={initialLikeCount} />
      <p>Show your support for this event.</p>
      {isOwner && (
        <button
          className={styles.deleteButton}
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
        >
          <Trash2 size={16} aria-hidden="true" />
          {isDeleting ? 'Deleting' : 'Delete event'}
        </button>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </aside>
  )
}
