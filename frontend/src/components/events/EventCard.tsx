import { CalendarDays, MapPin, MessageCircle } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'

import type { Post } from '../../api/types'
import { getAccent, getEventDateParts } from '../../utils/eventDisplay'
import styles from './EventCard.module.css'
import { EventDateBadge } from './EventDateBadge'
import { EventHashtags } from './EventHashtags'
import { EventImage } from './EventImage'
import { LikeButton } from './LikeButton'

export const EventCard = memo(function EventCard({
  post,
  featured = false,
}: {
  post: Post
  featured?: boolean
}) {
  const date = getEventDateParts(post.event_date)

  return (
    <article className={`${styles.eventCard} ${featured ? styles.featured : ''}`}>
      <Link className={styles.media} to={`/events/${post.id}`}>
        <EventImage
          imageUrl={post.image_url}
          alt={`${post.title} event`}
          width="1400"
          height="788"
          loading={featured ? 'eager' : 'lazy'}
          fetchPriority={featured ? 'high' : 'auto'}
          decoding="async"
        />
        <span className={styles.category}>{post.category}</span>
      </Link>
      <div className={styles.body}>
        <EventDateBadge value={post.event_date} accent={getAccent(post.id)} />
        <div className={styles.copy}>
          <div className={styles.meta}>
            <span>
              <CalendarDays size={14} aria-hidden="true" />
              {date.time}
            </span>
            <span>
              <MapPin size={14} aria-hidden="true" />
              {post.location}
            </span>
          </div>
          <h2>
            <Link to={`/events/${post.id}`}>{post.title}</Link>
          </h2>
          <p>{post.description}</p>
          <EventHashtags hashtags={post.hashtags} />
          <div className={styles.footer}>
            <Link className={styles.owner} to={`/users/${post.owner.id}`}>
              by {post.owner.username}
            </Link>
            <div className={styles.social}>
              <span title={`${post.comment_count} comments`}>
                <MessageCircle size={16} aria-hidden="true" />
                {post.comment_count}
              </span>
              <LikeButton resource="post" resourceId={post.id} initialCount={post.like_count} compact />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
})
