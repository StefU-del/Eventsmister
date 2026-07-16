import type { Comment } from '../../api/types'
import styles from './CommentList.module.css'
import { CommentItem } from './CommentItem'

type CommentListProps = {
  comments: Comment[]
  onDelete: (commentId: number) => Promise<void>
}

export function CommentList({ comments, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return <p className={styles.empty}>No comments yet. Start the conversation.</p>
  }

  return (
    <div className={styles.commentList}>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onDelete={onDelete} />
      ))}
    </div>
  )
}
