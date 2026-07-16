import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { eventPost } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { EventCard } from './EventCard'

describe('EventCard image loading', () => {
  it('prioritises the featured image and defers later card images', () => {
    renderWithProviders(
      <>
        <EventCard post={eventPost} featured />
        <EventCard post={{ ...eventPost, id: 12, title: 'Second event' }} />
      </>,
    )

    const images = [
      screen.getByRole('img', { name: 'Spring Jazz Courtyard event' }),
      screen.getByRole('img', { name: 'Second event event' }),
    ]

    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[0]).toHaveAttribute('src', eventPost.image_url)
    expect(images[1]).toHaveAttribute('loading', 'lazy')
    expect(images[1]).toHaveAttribute('width', '1400')
    expect(images[1]).toHaveAttribute('height', '788')
  })
})
