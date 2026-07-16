import { CalendarPlus, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { PostInput } from '../../api/types'
import { PhotoUploadField } from '../common/PhotoUploadField'
import { getDefaultEventDate, getMinimumEventDate } from '../../utils/eventDisplay'
import { parseHashtags } from '../../utils/hashtags'
import styles from './EventForm.module.css'

const categories = ['Music', 'Food', 'Arts', 'Community', 'Sport', 'Tech', 'Learning', 'Other']

type EventFormProps = {
  isSubmitting: boolean
  error: string | null
  token: string
  onSubmit: (input: PostInput) => Promise<void>
}

export function EventForm({ isSubmitting, error, token, onSubmit }: EventFormProps) {
  const [form, setForm] = useState<PostInput>({
    title: '',
    description: '',
    category: 'Music',
    location: '',
    image_url: '',
    hashtags: [],
    event_date: getDefaultEventDate(),
  })
  const [hashtagText, setHashtagText] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  function updateField<K extends keyof PostInput>(field: K, value: PostInput[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      image_url: form.image_url.trim(),
      hashtags: parseHashtags(hashtagText),
    })
  }

  return (
    <form className={styles.eventForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="event-title">Event title</label>
        <input
          id="event-title"
          value={form.title}
          minLength={3}
          maxLength={100}
          required
          onChange={(event) => updateField('title', event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="event-description">Description</label>
        <textarea
          id="event-description"
          value={form.description}
          minLength={10}
          maxLength={2000}
          rows={7}
          required
          onChange={(event) => updateField('description', event.target.value)}
        />
        <span>{form.description.length}/2000</span>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="event-category">Category</label>
          <select
            id="event-category"
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="event-location">London location</label>
          <input
            id="event-location"
            value={form.location}
            minLength={2}
            maxLength={100}
            required
            onChange={(event) => updateField('location', event.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="event-date">Date and time</label>
        <input
          id="event-date"
          type="datetime-local"
          value={form.event_date}
          min={getMinimumEventDate()}
          required
          onChange={(event) => updateField('event_date', event.target.value)}
        />
      </div>

      <PhotoUploadField
        id="event-image"
        label="Event photo"
        previewAlt="Event photo preview"
        token={token}
        value={form.image_url || null}
        required
        onChange={(imageUrl) => updateField('image_url', imageUrl ?? '')}
        onUploadingChange={setIsUploadingImage}
      />

      <div className={styles.field}>
        <label htmlFor="event-hashtags">Hashtags</label>
        <input
          id="event-hashtags"
          value={hashtagText}
          maxLength={247}
          placeholder="#live-music #camden #free"
          onChange={(event) => setHashtagText(event.target.value)}
        />
        <small>Up to eight tags, separated by spaces or commas.</small>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button
        className={styles.submitButton}
        type="submit"
        disabled={isSubmitting || isUploadingImage}
      >
        {isSubmitting ? (
          <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
        ) : (
          <CalendarPlus size={18} aria-hidden="true" />
        )}
        {isSubmitting ? 'Publishing event' : 'Publish event'}
      </button>
    </form>
  )
}
