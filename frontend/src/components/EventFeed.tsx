import { CalendarDays, Heart, MapPin } from 'lucide-react'

import type { Post } from '../api/posts'
import jazzCourtyard from '../assets/spring-jazz-courtyard.jpg'
import {
  getAccent,
  getEventDateParts,
  type AccentName,
} from '../utils/eventDisplay'
import styles from './EventFeed.module.css'

type EventFeedProps = {
  posts: Post[]
  savedEventIds: number[]
  onToggleSaved: (postId: number) => void
}

export function EventFeed({ posts, savedEventIds, onToggleSaved }: EventFeedProps) {
  const featuredPost = posts[0]
  const upcomingPosts = posts.slice(1)

  return (
    <div
      className={`${styles.eventLayout} ${
        upcomingPosts.length === 0 ? styles.singleEventLayout : ''
      }`}
    >
      {featuredPost && (
        <FeaturedEvent
          post={featuredPost}
          isSaved={savedEventIds.includes(featuredPost.id)}
          onToggleSaved={onToggleSaved}
        />
      )}

      {upcomingPosts.length > 0 && (
        <div className={styles.upcomingPanel} id="upcoming">
          <div className={styles.upcomingHeading}>
            <h3>Coming up</h3>
            <span>
              {upcomingPosts.length} {upcomingPosts.length === 1 ? 'event' : 'events'}
            </span>
          </div>
          <div className={styles.upcomingList}>
            {upcomingPosts.map((post) => (
              <UpcomingEvent
                key={post.id}
                post={post}
                isSaved={savedEventIds.includes(post.id)}
                onToggleSaved={onToggleSaved}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type EventCardProps = {
  post: Post
  isSaved: boolean
  onToggleSaved: (postId: number) => void
}

function FeaturedEvent({ post, isSaved, onToggleSaved }: EventCardProps) {
  const date = getEventDateParts(post.event_date)

  return (
    <article className={styles.featuredCard}>
      <div className={styles.featuredMedia}>
        <img src={jazzCourtyard} alt="People enjoying live music in a leafy London courtyard" />
        <span className={styles.categoryBadge}>{post.category}</span>
        <SaveButton post={post} isSaved={isSaved} onToggleSaved={onToggleSaved} featured />
      </div>
      <div className={styles.featuredBody}>
        <DateBlock day={date.day} month={date.month} />
        <div className={styles.eventCopy}>
          <div className={styles.eventMeta}>
            <span>
              <CalendarDays size={15} aria-hidden="true" />
              {date.time}
            </span>
            <span>
              <MapPin size={15} aria-hidden="true" />
              {post.location}
            </span>
          </div>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
        </div>
      </div>
    </article>
  )
}

function UpcomingEvent({ post, isSaved, onToggleSaved }: EventCardProps) {
  const date = getEventDateParts(post.event_date)

  return (
    <article className={styles.upcomingCard}>
      <DateBlock day={date.day} month={date.month} accent={getAccent(post.id)} small />
      <div className={styles.upcomingCopy}>
        <span className={styles.smallCategory}>{post.category}</span>
        <h4>{post.title}</h4>
        <p>
          {date.time} · {post.location}
        </p>
      </div>
      <SaveButton post={post} isSaved={isSaved} onToggleSaved={onToggleSaved} />
    </article>
  )
}

type DateBlockProps = {
  day: string
  month: string
  accent?: AccentName
  small?: boolean
}

function DateBlock({ day, month, accent = 'mint', small = false }: DateBlockProps) {
  return (
    <div className={`${small ? styles.smallDate : styles.dateBlock} ${styles[accent]}`}>
      <span>{month}</span>
      <strong>{day}</strong>
    </div>
  )
}

type SaveButtonProps = EventCardProps & {
  featured?: boolean
}

function SaveButton({ post, isSaved, onToggleSaved, featured = false }: SaveButtonProps) {
  return (
    <button
      className={featured ? styles.saveButton : styles.listSaveButton}
      type="button"
      aria-label={isSaved ? `Remove ${post.title} from saved events` : `Save ${post.title}`}
      title={isSaved ? 'Remove from saved' : 'Save event'}
      aria-pressed={isSaved}
      onClick={() => onToggleSaved(post.id)}
    >
      <Heart size={featured ? 19 : 18} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  )
}
