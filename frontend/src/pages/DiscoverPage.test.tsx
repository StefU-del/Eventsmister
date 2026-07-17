import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLike } from '../api/likes'
import { searchExternalEvents } from '../api/externalEvents'
import { getPosts, type Post } from '../api/posts'
import { authenticatedTestUser } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { DiscoverPage } from './DiscoverPage'

vi.mock('../api/posts', () => ({
  getPosts: vi.fn(),
}))

vi.mock('../api/likes', () => ({
  setLike: vi.fn(),
}))

vi.mock('../api/externalEvents', () => ({
  searchExternalEvents: vi.fn(),
}))

const posts: Post[] = [
  {
    id: 1,
    owner_id: 7,
    owner: {
      id: 7,
      username: 'londonlistener',
      interests: ['music'],
      profile_photo_url: null,
      created_at: '2030-03-01T10:00:00Z',
    },
    title: 'Spring Jazz Courtyard',
    description: 'Live music in a leafy courtyard.',
    category: 'Music',
    location: 'Camden',
    image_url: 'https://example.com/jazz.jpg',
    hashtags: ['jazz', 'camden'],
    event_date: '2030-05-20T18:30:00Z',
    created_at: '2030-04-01T10:00:00Z',
    like_count: 2,
    comment_count: 1,
  },
  {
    id: 2,
    owner_id: 8,
    owner: {
      id: 8,
      username: 'breadfriend',
      interests: ['food'],
      profile_photo_url: null,
      created_at: '2030-03-02T10:00:00Z',
    },
    title: 'Bread Making Workshop',
    description: 'Learn to make sourdough with a local baker.',
    category: 'Food',
    location: 'Hackney',
    image_url: 'https://example.com/bread.jpg',
    hashtags: ['sourdough'],
    event_date: '2030-05-22T11:00:00Z',
    created_at: '2030-04-02T10:00:00Z',
    like_count: 0,
    comment_count: 0,
  },
]

const mockedGetPosts = vi.mocked(getPosts)
const mockedSetLike = vi.mocked(setLike)
const mockedSearchExternalEvents = vi.mocked(searchExternalEvents)

beforeEach(() => {
  mockedGetPosts.mockReset()
  mockedSetLike.mockReset()
  mockedSearchExternalEvents.mockReset()
})

describe('DiscoverPage', () => {
  it('shows a loading state while events are requested', () => {
    mockedGetPosts.mockReturnValue(new Promise<Post[]>(() => undefined))

    renderWithProviders(<DiscoverPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Finding events')
  })

  it('shows the empty state when the API has no posts', async () => {
    mockedGetPosts.mockResolvedValue([])

    renderWithProviders(<DiscoverPage />)

    expect(
      await screen.findByRole('heading', { name: 'No events yet' }),
    ).toBeInTheDocument()
  })

  it('retries after an API error', async () => {
    const user = userEvent.setup()
    mockedGetPosts
      .mockRejectedValueOnce(new Error('Backend unavailable.'))
      .mockResolvedValueOnce(posts)

    renderWithProviders(<DiscoverPage />)

    expect(
      await screen.findByRole('heading', { name: 'Events could not load' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Spring Jazz Courtyard' }),
    ).toBeInTheDocument()
    expect(mockedGetPosts).toHaveBeenCalledTimes(2)
  })

  it('filters events by search text and category', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue(posts)

    renderWithProviders(<DiscoverPage />)

    await screen.findByRole('heading', { name: 'Spring Jazz Courtyard' })
    const searchInput = screen.getByRole('searchbox', { name: 'Search events' })

    await user.type(searchInput, 'bread')
    expect(screen.getByRole('heading', { name: 'Bread Making Workshop' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Spring Jazz Courtyard' })).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.click(screen.getByRole('button', { name: 'Music' }))
    expect(screen.getByRole('heading', { name: 'Spring Jazz Courtyard' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Bread Making Workshop' })).not.toBeInTheDocument()
  })

  it('clears filters when there are no matching events', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue(posts)

    renderWithProviders(<DiscoverPage />)

    await screen.findByRole('heading', { name: 'Spring Jazz Courtyard' })
    await user.type(screen.getByRole('searchbox', { name: 'Search events' }), 'opera')
    expect(
      screen.getByRole('heading', { name: 'No matching events' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByRole('heading', { name: 'Spring Jazz Courtyard' })).toBeInTheDocument()
  })

  it('toggles an authenticated event like', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue(posts)
    mockedSetLike.mockResolvedValue({ message: 'Post liked successfully', like_count: 3 })

    renderWithProviders(<DiscoverPage />, {
      auth: {
        user: { ...authenticatedTestUser, interests: [] },
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    const eventHeading = await screen.findByRole('heading', { name: 'Spring Jazz Courtyard' })
    const eventCard = eventHeading.closest('article')
    expect(eventCard).not.toBeNull()
    const likeButton = within(eventCard!).getByRole('button', { name: 'Like event' })
    expect(likeButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(likeButton)

    expect(within(eventCard!).getByRole('button', { name: 'Unlike event' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(mockedSetLike).toHaveBeenCalledWith('post', posts[0].id, false, 'test-token')
  })

  it('recommends matching events from the current user interests', async () => {
    mockedGetPosts.mockResolvedValue(posts)

    renderWithProviders(<DiscoverPage />, {
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    const recommendations = await screen.findByRole('region', {
      name: 'Picked around your interests',
    })
    expect(
      within(recommendations).getByRole('heading', { name: 'Spring Jazz Courtyard' }),
    ).toBeInTheDocument()
    expect(
      within(recommendations).queryByRole('heading', { name: 'Bread Making Workshop' }),
    ).not.toBeInTheDocument()
  })

  it('filters the feed from a hashtag URL', async () => {
    mockedGetPosts.mockResolvedValue(posts)

    renderWithProviders(<DiscoverPage />, { route: '/?tag=sourdough' })

    expect(
      await screen.findByRole('heading', { name: 'Bread Making Workshop' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '#sourdough' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Spring Jazz Courtyard' }),
    ).not.toBeInTheDocument()
  })

  it('moves focus to search from the browse button', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue([])

    renderWithProviders(<DiscoverPage />)

    await screen.findByRole('heading', { name: 'No events yet' })
    await user.click(screen.getByRole('button', { name: 'Browse events' }))

    expect(screen.getByRole('searchbox', { name: 'Search events' })).toHaveFocus()
  })

  it('keeps wider search private to authenticated users', async () => {
    mockedGetPosts.mockResolvedValue(posts)

    renderWithProviders(<DiscoverPage />)

    await screen.findByRole('heading', { name: 'Spring Jazz Courtyard' })
    expect(screen.queryByRole('button', { name: 'Search wider' })).not.toBeInTheDocument()
  })

  it('searches connected providers and renders attributed external events', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue(posts)
    mockedSearchExternalEvents.mockResolvedValue({
      events: [
        {
          external_id: 'skiddle-81',
          source: 'skiddle',
          source_name: 'Skiddle',
          source_url: 'https://www.skiddle.com/events/81',
          source_logo_url: null,
          title: 'Outside jazz festival',
          description: 'A full afternoon of new London jazz.',
          category: 'Music',
          location: 'Hackney, London',
          image_url: 'https://images.example/jazz.jpg',
          event_date: '2030-08-20T19:00:00Z',
        },
      ],
      providers: [
        {
          source: 'skiddle',
          source_name: 'Skiddle',
          enabled: true,
          returned: 1,
          error: null,
        },
        {
          source: 'ticketmaster',
          source_name: 'Ticketmaster',
          enabled: true,
          returned: 0,
          error: 'The provider timed out.',
        },
      ],
      terms: ['jazz', 'music'],
      search_suggestions_html: '<div>Google Search suggestions</div>',
    })

    renderWithProviders(<DiscoverPage />, {
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })
    await screen.findAllByRole('heading', { name: 'Spring Jazz Courtyard' })
    await user.type(screen.getByRole('searchbox', { name: 'Search events' }), 'jazz')
    await user.click(screen.getByRole('button', { name: 'Search wider' }))

    expect(
      await screen.findByRole('heading', { name: 'Outside jazz festival' }),
    ).toBeInTheDocument()
    expect(mockedSearchExternalEvents).toHaveBeenCalledWith(
      'jazz',
      'test-token',
      expect.any(AbortSignal),
    )
    expect(screen.getByRole('link', { name: 'View on Skiddle' })).toHaveAttribute(
      'href',
      'https://www.skiddle.com/events/81',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Ticketmaster could not respond')
    expect(screen.getByTitle('Google Search suggestions')).toBeInTheDocument()
  })

  it('keeps Google attribution visible when no grounded event is usable', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue(posts)
    mockedSearchExternalEvents.mockResolvedValue({
      events: [],
      providers: [
        {
          source: 'gemini',
          source_name: 'Google Search',
          enabled: true,
          returned: 0,
          error: null,
        },
      ],
      terms: ['jazz'],
      search_suggestions_html: '<div>Google Search suggestions</div>',
    })

    renderWithProviders(<DiscoverPage />, {
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })
    await screen.findAllByRole('heading', { name: 'Spring Jazz Courtyard' })
    await user.type(screen.getByRole('searchbox', { name: 'Search events' }), 'jazz')
    await user.click(screen.getByRole('button', { name: 'Search wider' }))

    expect(
      await screen.findByRole('heading', { name: 'No wider matches found' }),
    ).toBeInTheDocument()
    expect(screen.getByTitle('Google Search suggestions')).toBeInTheDocument()
  })
})
