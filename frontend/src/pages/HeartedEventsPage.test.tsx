import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLike } from '../api/likes'
import { getHeartedPosts, type Post } from '../api/posts'
import { authenticatedTestUser, eventPost } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { HeartedEventsPage } from './HeartedEventsPage'

vi.mock('../api/posts', () => ({
  getHeartedPosts: vi.fn(),
}))

vi.mock('../api/likes', () => ({
  setLike: vi.fn(),
}))

const mockedGetHeartedPosts = vi.mocked(getHeartedPosts)
const mockedSetLike = vi.mocked(setLike)
const auth = {
  user: authenticatedTestUser,
  token: 'test-token',
  isAuthenticated: true,
  likedPostIds: [eventPost.id],
}

beforeEach(() => {
  mockedGetHeartedPosts.mockReset()
  mockedSetLike.mockReset()
})

describe('HeartedEventsPage', () => {
  it('loads the current user hearted events', async () => {
    mockedGetHeartedPosts.mockResolvedValue([eventPost])
    renderWithProviders(<HeartedEventsPage />, { auth })

    expect(screen.getByRole('status')).toHaveTextContent('Loading hearted events')
    expect(await screen.findByRole('heading', { name: eventPost.title })).toBeInTheDocument()
    expect(mockedGetHeartedPosts).toHaveBeenCalledWith('test-token', expect.any(AbortSignal))
    expect(screen.getByLabelText('1 hearted event')).toHaveTextContent('1')
  })

  it('shows an empty state when no events have been hearted', async () => {
    mockedGetHeartedPosts.mockResolvedValue([])
    renderWithProviders(<HeartedEventsPage />, {
      auth: { ...auth, likedPostIds: [] },
    })

    expect(
      await screen.findByRole('heading', { name: 'No hearted events yet' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Discover events' })).toHaveAttribute('href', '/')
  })

  it('retries after a loading error', async () => {
    const user = userEvent.setup()
    mockedGetHeartedPosts
      .mockRejectedValueOnce(new Error('Hearted events are unavailable.'))
      .mockResolvedValueOnce([eventPost])
    renderWithProviders(<HeartedEventsPage />, { auth })

    expect(
      await screen.findByRole('heading', { name: 'Hearted events could not load' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: eventPost.title })).toBeInTheDocument()
    expect(mockedGetHeartedPosts).toHaveBeenCalledTimes(2)
  })

  it('removes an event immediately after it is unhearted', async () => {
    const user = userEvent.setup()
    mockedGetHeartedPosts.mockResolvedValue([eventPost])
    mockedSetLike.mockResolvedValue({ message: 'Post unliked successfully', like_count: 1 })
    renderWithProviders(<HeartedEventsPage />, { auth })

    await screen.findByRole('heading', { name: eventPost.title })
    await user.click(screen.getByRole('button', { name: 'Unlike event' }))

    expect(
      await screen.findByRole('heading', { name: 'No hearted events yet' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: eventPost.title })).not.toBeInTheDocument()
    expect(mockedSetLike).toHaveBeenCalledWith('post', eventPost.id, true, 'test-token')
  })

  it('ignores an aborted request', () => {
    mockedGetHeartedPosts.mockImplementation(
      (_token, signal) =>
        new Promise<Post[]>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          )
        }),
    )

    const { unmount } = renderWithProviders(<HeartedEventsPage />, { auth })
    unmount()

    expect(mockedGetHeartedPosts).toHaveBeenCalledOnce()
  })
})
