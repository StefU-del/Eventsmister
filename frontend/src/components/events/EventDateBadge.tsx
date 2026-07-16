import { getEventDateParts, type AccentName } from '../../utils/eventDisplay'
import styles from './EventDateBadge.module.css'

type EventDateBadgeProps = {
  value: string
  accent?: AccentName
  compact?: boolean
}

export function EventDateBadge({ value, accent = 'mint', compact = false }: EventDateBadgeProps) {
  const date = getEventDateParts(value)

  return (
    <time
      className={`${styles.dateBadge} ${styles[accent]} ${compact ? styles.compact : ''}`}
      dateTime={value}
    >
      <span>{date.month}</span>
      <strong>{date.day}</strong>
    </time>
  )
}
