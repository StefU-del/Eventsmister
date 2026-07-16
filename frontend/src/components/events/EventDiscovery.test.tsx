import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { eventPost } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { EventHashtags } from './EventHashtags'
import { EventImage } from './EventImage'
import { EventRecommendations } from './EventRecommendations'

describe('event discovery components', () => {
  it('links hashtags to filtered discovery results', () => {
    renderWithProviders(<EventHashtags hashtags={['live-music', 'camden']} />)

    expect(screen.getByRole('link', { name: '#live-music' })).toHaveAttribute(
      'href',
      '/?tag=live-music',
    )
  })

  it('renders nothing for empty hashtag and recommendation collections', () => {
    const { container, rerender } = renderWithProviders(<EventHashtags hashtags={[]} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<EventRecommendations posts={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('falls back when an event image URL cannot load', () => {
    renderWithProviders(
      <EventImage imageUrl="https://example.com/missing.jpg" alt="Missing event" />,
    )
    const image = screen.getByRole('img', { name: 'Missing event' })

    fireEvent.error(image)
    expect(image).not.toHaveAttribute('src', 'https://example.com/missing.jpg')
  })

  it('uses the bundled fallback when an event has no image URL', () => {
    renderWithProviders(<EventImage imageUrl={null} alt="Legacy event" />)

    expect(screen.getByRole('img', { name: 'Legacy event' }).getAttribute('src')).toContain(
      'spring-jazz-courtyard',
    )
  })

  it('renders a recommendation collection', () => {
    renderWithProviders(<EventRecommendations posts={[eventPost]} />)

    expect(
      screen.getByRole('heading', { name: 'Picked around your interests' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: eventPost.title })).toBeInTheDocument()
  })
})
