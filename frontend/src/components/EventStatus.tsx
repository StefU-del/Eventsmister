import {
  AlertCircle,
  CalendarDays,
  LoaderCircle,
  RefreshCw,
  Search,
} from 'lucide-react'

import styles from './EventStatus.module.css'

type EventStatusProps =
  | { kind: 'loading' }
  | { kind: 'error'; message: string; onAction: () => void }
  | { kind: 'empty' }
  | { kind: 'noMatches'; onAction: () => void }

export function EventStatus(props: EventStatusProps) {
  if (props.kind === 'loading') {
    return (
      <div className={styles.statusState} role="status" aria-live="polite">
        <LoaderCircle className={styles.spinner} size={25} aria-hidden="true" />
        <h3>Finding events</h3>
        <p>Gathering the latest posts from across London.</p>
      </div>
    )
  }

  if (props.kind === 'error') {
    return (
      <div className={styles.statusState} role="alert">
        <AlertCircle size={25} aria-hidden="true" />
        <h3>Events could not load</h3>
        <p>{props.message}</p>
        <button type="button" onClick={props.onAction}>
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  }

  if (props.kind === 'empty') {
    return (
      <div className={styles.statusState}>
        <CalendarDays size={25} aria-hidden="true" />
        <h3>No events yet</h3>
        <p>New events will appear here as soon as they are posted.</p>
      </div>
    )
  }

  return (
    <div className={styles.statusState}>
      <Search size={25} aria-hidden="true" />
      <h3>No matching events</h3>
      <p>Try another search or clear the category filter.</p>
      <button type="button" onClick={props.onAction}>
        Clear filters
      </button>
    </div>
  )
}
