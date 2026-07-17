import { CalendarDays, ExternalLink, MapPin } from 'lucide-react'

import type { ExternalEvent } from '../../api/types'
import { getEventDateParts } from '../../utils/eventDisplay'
import { EventImage } from './EventImage'
import styles from './ExternalEventCard.module.css'


export function ExternalEventCard({ event }: { event: ExternalEvent }) {
  const date = getEventDateParts(event.event_date)

  return (
    <article className={styles.card}>
      <a
        className={styles.media}
        href={event.source_url}
        target="_blank"
        rel="noreferrer"
      >
        <EventImage
          imageUrl={event.image_url}
          alt={`${event.title} event`}
          width="900"
          height="506"
          loading="lazy"
          decoding="async"
        />
        <span className={styles.category}>{event.category}</span>
      </a>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span>
            <CalendarDays size={14} aria-hidden="true" />
            {date.day} {date.month}, {date.time}
          </span>
          <span>
            <MapPin size={14} aria-hidden="true" />
            {event.location}
          </span>
        </div>

        <h2>
          <a href={event.source_url} target="_blank" rel="noreferrer">
            {event.title}
          </a>
        </h2>
        {event.description && <p>{event.description}</p>}

        <div className={styles.footer}>
          <a
            className={styles.source}
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`View on ${event.source_name}`}
          >
            {event.source_logo_url ? (
              <img src={event.source_logo_url} alt={event.source_name} />
            ) : (
              <span>{event.source_name}</span>
            )}
          </a>
          <a
            className={styles.openLink}
            href={event.source_url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${event.title} on ${event.source_name}`}
          >
            View event
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  )
}
