import { CalendarDays, MapPin, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { createComment, deleteComment, getComments } from '../api/comments'
import { ApiError } from '../api/client'
import { deletePost, getPost } from '../api/posts'
import type { Comment, Post } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { CommentForm } from '../components/comments/CommentForm'
import { CommentList } from '../components/comments/CommentList'
import { PageState } from '../components/common/PageState'
import { EventActions } from '../components/events/EventActions'
import { EventHashtags } from '../components/events/EventHashtags'
import { EventImage } from '../components/events/EventImage'
import { formatFullEventDate } from '../utils/eventDisplay'
import { getErrorMessage } from '../utils/errors'
import pageStyles from './Page.module.css'
import styles from './EventDetailPage.module.css'

export function EventDetailPage() {
  const { postId } = useParams()
  const numericPostId = Number(postId)
  const isValidPostId = Number.isInteger(numericPostId) && numericPostId > 0
  const { isAuthenticated, token, user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)
  const [isCommenting, setIsCommenting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidPostId) {
      return
    }

    const controller = new AbortController()
    Promise.all([
      getPost(numericPostId, controller.signal),
      getComments(numericPostId, controller.signal),
    ])
      .then(([loadedPost, loadedComments]) => {
        setPost(loadedPost)
        setComments(loadedComments)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setIsNotFound(error instanceof ApiError && error.status === 404)
        setLoadError(getErrorMessage(error, 'This event could not be loaded.'))
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [isValidPostId, numericPostId, requestVersion])

  function retry() {
    setIsLoading(true)
    setLoadError(null)
    setIsNotFound(false)
    setRequestVersion((version) => version + 1)
  }

  async function handleCreateComment(content: string) {
    if (!token || content.length === 0) {
      return false
    }

    setIsCommenting(true)
    setCommentError(null)
    try {
      const comment = await createComment(numericPostId, content, token)
      setComments((current) => [comment, ...current])
      return true
    } catch (error) {
      setCommentError(getErrorMessage(error, 'Your comment could not be posted.'))
      return false
    } finally {
      setIsCommenting(false)
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!token) {
      return
    }

    setCommentError(null)
    try {
      await deleteComment(commentId, token)
      setComments((current) => current.filter((comment) => comment.id !== commentId))
    } catch (error) {
      setCommentError(getErrorMessage(error, 'The comment could not be deleted.'))
    }
  }

  async function handleDeletePost() {
    if (!token || !post || !window.confirm('Delete this event and all of its comments?')) {
      return
    }

    setIsDeletingPost(true)
    setActionError(null)
    try {
      await deletePost(post.id, token)
      navigate('/')
    } catch (error) {
      setActionError(getErrorMessage(error, 'The event could not be deleted.'))
      setIsDeletingPost(false)
    }
  }

  if (!isValidPostId || isNotFound) {
    return (
      <section className={pageStyles.page}>
        <PageState
          kind="notFound"
          title="Event not found"
          message="This event may have been removed or the link may be incorrect."
          action={<Link className={pageStyles.primaryLink} to="/">Browse events</Link>}
        />
      </section>
    )
  }

  if (isLoading) {
    return <section className={pageStyles.page}><PageState kind="loading" title="Loading event" /></section>
  }

  if (loadError || !post) {
    return (
      <section className={pageStyles.page}>
        <PageState
          kind="error"
          title="Event could not load"
          message={loadError ?? 'This event could not be loaded.'}
          action={<button className={pageStyles.secondaryButton} type="button" onClick={retry}>Try again</button>}
        />
      </section>
    )
  }

  const isOwner = user?.id === post.owner_id

  return (
    <article className={pageStyles.page}>
      <div className={styles.eventHero}>
        <EventImage
          imageUrl={post.image_url}
          alt={`${post.title} event`}
          width="1400"
          height="788"
          fetchPriority="high"
          decoding="async"
        />
        <span>{post.category}</span>
      </div>

      <div className={styles.detailLayout}>
        <div className={styles.mainColumn}>
          <header className={styles.eventHeader}>
            <div className={styles.eventMeta}>
              <span><CalendarDays size={17} aria-hidden="true" />{formatFullEventDate(post.event_date)}</span>
              <span><MapPin size={17} aria-hidden="true" />{post.location}</span>
            </div>
            <h1>{post.title}</h1>
            <p className={styles.ownerLine}>Shared by <Link to={`/users/${post.owner.id}`}>{post.owner.username}</Link></p>
          </header>

          <section className={styles.description} aria-labelledby="about-event">
            <h2 id="about-event">About this event</h2>
            <p>{post.description}</p>
            <EventHashtags hashtags={post.hashtags} />
          </section>

          <section className={styles.commentsSection} aria-labelledby="event-comments">
            <div className={styles.commentsHeading}>
              <h2 id="event-comments">Conversation</h2>
              <span><MessageCircle size={16} aria-hidden="true" />{comments.length}</span>
            </div>

            {isAuthenticated ? (
              <CommentForm
                isSubmitting={isCommenting}
                error={commentError}
                onSubmit={handleCreateComment}
              />
            ) : (
              <p className={styles.loginPrompt}>
                <Link to="/login" state={{ from: `/events/${post.id}` }}>Log in</Link> to join the conversation.
              </p>
            )}
            <CommentList comments={comments} onDelete={handleDeleteComment} />
          </section>
        </div>

        <EventActions
          postId={post.id}
          initialLikeCount={post.like_count}
          isOwner={isOwner}
          isDeleting={isDeletingPost}
          error={actionError}
          onDelete={handleDeletePost}
        />
      </div>
    </article>
  )
}
