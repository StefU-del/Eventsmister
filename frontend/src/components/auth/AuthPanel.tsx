import type { ReactNode } from 'react'

import styles from './AuthPanel.module.css'

type AuthPanelProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthPanel({ eyebrow, title, description, children, footer }: AuthPanelProps) {
  return (
    <section className={styles.authPage}>
      <div className={styles.intro}>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className={styles.panel}>
        {children}
        <div className={styles.footer}>{footer}</div>
      </div>
    </section>
  )
}
