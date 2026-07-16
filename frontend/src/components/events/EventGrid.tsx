import type { Post } from '../../api/types'
import styles from './EventGrid.module.css'
import { EventCard } from './EventCard'

export function EventGrid({ posts, featureFirst = false }: { posts: Post[]; featureFirst?: boolean }) {
  return (
    <div className={styles.eventGrid}>
      {posts.map((post, index) => (
        <EventCard key={post.id} post={post} featured={featureFirst && index === 0} />
      ))}
    </div>
  )
}
