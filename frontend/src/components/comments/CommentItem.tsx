import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { Comment } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { formatCreatedAt } from '../../utils/eventDisplay'
import styles from './CommentItem.module.css'
import { LikeButton } from '../events/LikeButton'

type CommentItemProps = {
  comment: Comment
  onDelete: (commentId: number) => Promise<void>
}

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwner = user?.id === comment.owner_id

  async function handleDelete() {
    if (!window.confirm('Delete this comment? This cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <article className={styles.commentItem}>
      <div className={styles.avatar} aria-hidden="true">
        {comment.owner.username.slice(0, 1).toUpperCase()}
      </div>
      <div className={styles.commentBody}>
        <header>
          <div>
            <Link to={`/users/${comment.owner.id}`}>{comment.owner.username}</Link>
            <time dateTime={comment.created_at}>{formatCreatedAt(comment.created_at)}</time>
          </div>
          {isOwner && (
            <button
              className={styles.deleteButton}
              type="button"
              title="Delete comment"
              aria-label={`Delete comment by ${comment.owner.username}`}
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          )}
        </header>
        <p>{comment.content}</p>
        <LikeButton
          resource="comment"
          resourceId={comment.id}
          initialCount={comment.like_count}
          compact
        />
      </div>
    </article>
  )
}
