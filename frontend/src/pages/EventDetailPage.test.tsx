import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createComment, deleteComment, getComments } from '../api/comments'
import { deletePost, getPost } from '../api/posts'
import { authenticatedTestUser, eventComment, eventPost } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { EventDetailPage } from './EventDetailPage'

vi.mock('../api/posts', () => ({
  getPost: vi.fn(),
  deletePost: vi.fn(),
}))

vi.mock('../api/comments', () => ({
  getComments: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
}))

const mockedGetPost = vi.mocked(getPost)
const mockedDeletePost = vi.mocked(deletePost)
const mockedGetComments = vi.mocked(getComments)
const mockedCreateComment = vi.mocked(createComment)
const mockedDeleteComment = vi.mocked(deleteComment)

beforeEach(() => {
  mockedGetPost.mockReset()
  mockedDeletePost.mockReset()
  mockedGetComments.mockReset()
  mockedCreateComment.mockReset()
  mockedDeleteComment.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('EventDetailPage', () => {
  it('lets an authenticated user add and delete their comment', async () => {
    const user = userEvent.setup()
    const newComment = { ...eventComment, id: 22, content: 'Count me in.' }
    mockedGetPost.mockResolvedValue(eventPost)
    mockedGetComments.mockResolvedValue([eventComment])
    mockedCreateComment.mockResolvedValue(newComment)
    mockedDeleteComment.mockResolvedValue({ message: 'Comment deleted successfully' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<EventDetailPage />, {
      route: `/events/${eventPost.id}`,
      path: '/events/:postId',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    expect(await screen.findByRole('heading', { name: eventPost.title })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Add to the conversation'), 'Count me in.')
    await user.click(screen.getByRole('button', { name: 'Post comment' }))

    expect(await screen.findByText('Count me in.')).toBeInTheDocument()
    expect(mockedCreateComment).toHaveBeenCalledWith(eventPost.id, 'Count me in.', 'test-token')

    const existingComment = screen.getByText(eventComment.content).closest('article')
    expect(existingComment).not.toBeNull()
    await user.click(
      within(existingComment!).getByRole('button', {
        name: `Delete comment by ${authenticatedTestUser.username}`,
      }),
    )

    await waitFor(() => expect(screen.queryByText(eventComment.content)).not.toBeInTheDocument())
    expect(mockedDeleteComment).toHaveBeenCalledWith(eventComment.id, 'test-token')
  })

  it('lets the event owner delete their post', async () => {
    const user = userEvent.setup()
    const ownedPost = {
      ...eventPost,
      owner_id: authenticatedTestUser.id,
      owner: authenticatedTestUser,
    }
    mockedGetPost.mockResolvedValue(ownedPost)
    mockedGetComments.mockResolvedValue([])
    mockedDeletePost.mockResolvedValue({ message: 'Post deleted successfully' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<EventDetailPage />, {
      route: `/events/${ownedPost.id}`,
      path: '/events/:postId',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    await user.click(await screen.findByRole('button', { name: 'Delete event' }))

    expect(mockedDeletePost).toHaveBeenCalledWith(ownedPost.id, 'test-token')
  })

  it('invites guests to log in before commenting', async () => {
    mockedGetPost.mockResolvedValue(eventPost)
    mockedGetComments.mockResolvedValue([])

    renderWithProviders(<EventDetailPage />, {
      route: `/events/${eventPost.id}`,
      path: '/events/:postId',
    })

    expect(await screen.findByText(/to join the conversation/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Add to the conversation')).not.toBeInTheDocument()
  })
})
