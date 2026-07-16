import type { Post } from '../../api/types'
import { EventGrid } from './EventGrid'
import styles from './EventRecommendations.module.css'

export function EventRecommendations({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className={styles.recommendations} aria-labelledby="recommendations-title">
      <header>
        <span>For you</span>
        <h2 id="recommendations-title">Picked around your interests</h2>
      </header>
      <EventGrid posts={posts} />
    </section>
  )
}
