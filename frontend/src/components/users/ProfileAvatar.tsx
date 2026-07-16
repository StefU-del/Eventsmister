import styles from './ProfileAvatar.module.css'

type ProfileAvatarProps = {
  username: string
  photoUrl: string | null
  size?: 'small' | 'medium' | 'large'
  decorative?: boolean
}

export function ProfileAvatar({
  username,
  photoUrl,
  size = 'medium',
  decorative = false,
}: ProfileAvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      aria-hidden={decorative || undefined}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={decorative ? '' : `${username}'s profile`} />
      ) : (
        username.slice(0, 2).toUpperCase()
      )}
    </span>
  )
}
