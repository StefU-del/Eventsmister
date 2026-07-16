import { AlertCircle, CalendarDays, LoaderCircle, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'

import styles from './PageState.module.css'

type PageStateProps = {
  kind: 'loading' | 'error' | 'empty' | 'notFound'
  title: string
  message?: string
  action?: ReactNode
  compact?: boolean
}

const icons = {
  loading: LoaderCircle,
  error: AlertCircle,
  empty: CalendarDays,
  notFound: SearchX,
}

export function PageState({ kind, title, message, action, compact = false }: PageStateProps) {
  const Icon = icons[kind]

  return (
    <div
      className={`${styles.pageState} ${compact ? styles.compact : ''}`}
      role={kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined}
      aria-live={kind === 'loading' ? 'polite' : undefined}
    >
      <Icon
        className={kind === 'loading' ? styles.spinner : undefined}
        size={26}
        aria-hidden="true"
      />
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}
