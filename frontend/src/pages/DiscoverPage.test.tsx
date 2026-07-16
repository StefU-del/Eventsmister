import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPosts, type Post } from '../api/posts'
import { DiscoverPage } from './DiscoverPage'

vi.mock('../api/posts', () => ({
  getPosts: vi.fn(),
}))

const posts: Post[] = [
  {
    id: 1,
    owner_id: 7,
    title: 'Spring Jazz Courtyard',
    description: 'Live music in a leafy courtyard.',
    category: 'Music',
    location: 'Camden',
    event_date: '2030-05-20T18:30:00Z',
    created_at: '2030-04-01T10:00:00Z',
  },
  {
    id: 2,
    owner_id: 8,
    title: 'Bread Making Workshop',
    description: 'Learn to make sourdough with a local baker.',
    category: 'Food',
    location: 'Hackney',
    event_date: '2030-05-22T11:00:00Z',
    created_at: '2030-04-02T10:00:00Z',
  },
]

const mockedGetPosts = vi.mocked(getPosts)

beforeEach(() => {
  mockedGetPosts.mockReset()
})

describe('DiscoverPage', () => {
  it('shows a loading state while events are requested', () => {
    mockedGetPosts.mockReturnValue(new Promise<Post[]>(() => undefined))

    render(<DiscoverPage />)

    expect(screen.getByRole('status')).toHaveTextContent('Finding events')
  })

  it('shows the empty state when the API has no posts', async () => {
    mockedGetPosts.mockResolvedValue([])

    render(<DiscoverPage />)

    expect(
      await screen.findByRole('heading', { name: 'No events yet' }),
    ).toBeInTheDocument()
  })

  it('retries after an API error', async () => {
    const user = userEvent.setup()
    mockedGetPosts
      .mockRejectedValueOnce(new Error('Backend unavailable.'))
      .mockResolvedValueOnce(posts)

    render(<DiscoverPage />)

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

    render(<DiscoverPage />)

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

    render(<DiscoverPage />)

    await screen.findByRole('heading', { name: 'Spring Jazz Courtyard' })
    await user.type(screen.getByRole('searchbox', { name: 'Search events' }), 'opera')
    expect(
      screen.getByRole('heading', { name: 'No matching events' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByRole('heading', { name: 'Spring Jazz Courtyard' })).toBeInTheDocument()
  })

  it('toggles an event saved state', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue(posts)

    render(<DiscoverPage />)

    const saveButton = await screen.findByRole('button', {
      name: 'Save Spring Jazz Courtyard',
    })
    expect(saveButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(saveButton)

    expect(
      screen.getByRole('button', {
        name: 'Remove Spring Jazz Courtyard from saved events',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('moves focus to search from the browse button', async () => {
    const user = userEvent.setup()
    mockedGetPosts.mockResolvedValue([])

    render(<DiscoverPage />)

    await screen.findByRole('heading', { name: 'No events yet' })
    await user.click(screen.getByRole('button', { name: 'Browse events' }))

    expect(screen.getByRole('searchbox', { name: 'Search events' })).toHaveFocus()
  })
})
