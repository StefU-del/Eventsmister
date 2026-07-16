import { LoaderCircle, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import styles from './CommentForm.module.css'

type CommentFormProps = {
  isSubmitting: boolean
  error: string | null
  onSubmit: (content: string) => Promise<boolean>
}

export function CommentForm({ isSubmitting, error, onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const wasCreated = await onSubmit(content.trim())
    if (wasCreated) {
      setContent('')
    }
  }

  return (
    <form className={styles.commentForm} onSubmit={handleSubmit}>
      <label htmlFor="comment-content">Add to the conversation</label>
      <textarea
        id="comment-content"
        value={content}
        minLength={1}
        maxLength={1000}
        rows={4}
        required
        onChange={(event) => setContent(event.target.value)}
      />
      <div className={styles.formFooter}>
        <span>{content.length}/1000</span>
        <button type="submit" disabled={isSubmitting || content.trim().length === 0}>
          {isSubmitting ? (
            <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />
          ) : (
            <Send size={17} aria-hidden="true" />
          )}
          {isSubmitting ? 'Posting' : 'Post comment'}
        </button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
