import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createPost } from '../api/posts'
import type { PostInput } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { PageHeader } from '../components/common/PageHeader'
import { EventForm } from '../components/events/EventForm'
import { getErrorMessage } from '../utils/errors'
import pageStyles from './Page.module.css'

export function CreateEventPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(input: PostInput) {
    if (!token) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const post = await createPost(input, token)
      navigate(`/events/${post.id}`)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'The event could not be published.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={pageStyles.narrowPage}>
      <PageHeader
        eyebrow="Share a find"
        title="Create an event"
        description="Add the details people need to decide whether this belongs in their London week."
      />
      <EventForm
        isSubmitting={isSubmitting}
        error={error}
        token={token ?? ''}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
