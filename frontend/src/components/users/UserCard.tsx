import { ArrowRight, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { PublicUser } from '../../api/types'
import { formatMemberSince } from '../../utils/eventDisplay'
import styles from './UserCard.module.css'
import { ProfileAvatar } from './ProfileAvatar'

export function UserCard({ user }: { user: PublicUser }) {
  return (
    <article className={styles.userCard}>
      <ProfileAvatar
        username={user.username}
        photoUrl={user.profile_photo_url}
        decorative
      />
      <div className={styles.copy}>
        <h2>{user.username}</h2>
        <p>
          <CalendarDays size={14} aria-hidden="true" />
          {formatMemberSince(user.created_at)}
        </p>
      </div>
      <Link to={`/users/${user.id}`} aria-label={`View ${user.username}'s profile`}>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </article>
  )
}
