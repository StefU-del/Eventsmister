import { Link } from 'react-router-dom'

import styles from './EventHashtags.module.css'

export function EventHashtags({ hashtags }: { hashtags: string[] }) {
  if (hashtags.length === 0) {
    return null
  }

  return (
    <ul className={styles.hashtags} aria-label="Event hashtags">
      {hashtags.map((hashtag) => (
        <li key={hashtag}>
          <Link to={`/?tag=${encodeURIComponent(hashtag)}`}>#{hashtag}</Link>
        </li>
      ))}
    </ul>
  )
}
