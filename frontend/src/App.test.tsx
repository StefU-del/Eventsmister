import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getComments } from './api/comments'
import { getHeartedPosts, getPost, getPosts } from './api/posts'
import { getUser, getUserPosts } from './api/users'
import App from './App'
import { authenticatedTestUser, eventOwner, eventPost } from './test/fixtures'
import { renderWithProviders } from './test/render'

vi.mock('./api/comments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/comments')>()
  return { ...actual, getComments: vi.fn() }
})

vi.mock('./api/posts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/posts')>()
  return { ...actual, getHeartedPosts: vi.fn(), getPost: vi.fn(), getPosts: vi.fn() }
})

vi.mock('./api/users', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/users')>()
  return { ...actual, getUser: vi.fn(), getUserPosts: vi.fn() }
})

const mockedGetComments = vi.mocked(getComments)
const mockedGetHeartedPosts = vi.mocked(getHeartedPosts)
const mockedGetPost = vi.mocked(getPost)
const mockedGetPosts = vi.mocked(getPosts)
const mockedGetUser = vi.mocked(getUser)
const mockedGetUserPosts = vi.mocked(getUserPosts)

beforeEach(() => {
  mockedGetComments.mockReset()
  mockedGetHeartedPosts.mockReset()
  mockedGetPost.mockReset()
  mockedGetPosts.mockReset()
  mockedGetUser.mockReset()
  mockedGetUserPosts.mockReset()
  mockedGetComments.mockResolvedValue([])
  mockedGetHeartedPosts.mockResolvedValue([])
  mockedGetPost.mockResolvedValue(eventPost)
  mockedGetPosts.mockResolvedValue([])
  mockedGetUser.mockResolvedValue(eventOwner)
  mockedGetUserPosts.mockResolvedValue([])
})

describe('application routing', () => {
  it('redirects guests from event creation to login', async () => {
    renderWithProviders(<App />, { route: '/events/new' })

    expect(
      await screen.findByRole('heading', { name: 'Your London plans are waiting.' }),
    ).toBeInTheDocument()
  })

  it('shows a session restoration state before resolving a protected route', () => {
    renderWithProviders(<App />, { route: '/events/new', auth: { isReady: false } })

    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session')
  })

  it('renders a not-found page for unknown routes', async () => {
    renderWithProviders(<App />, { route: '/not-a-real-page' })

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it.each([
    ['/register', 'Make more of London.'],
  ])('loads the %s route on demand', async (route, heading) => {
    renderWithProviders(<App />, { route })

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('redirects guests from people search to login', async () => {
    renderWithProviders(<App />, { route: '/people' })

    expect(
      await screen.findByRole('heading', { name: 'Your London plans are waiting.' }),
    ).toBeInTheDocument()
  })

  it('redirects guests from hearted events to login', async () => {
    renderWithProviders(<App />, { route: '/hearted' })

    expect(
      await screen.findByRole('heading', { name: 'Your London plans are waiting.' }),
    ).toBeInTheDocument()
  })

  it('loads hearted events for an authenticated user', async () => {
    renderWithProviders(<App />, {
      route: '/hearted',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    expect(await screen.findByRole('heading', { name: 'Hearted events' })).toBeInTheDocument()
  })

  it('loads people search for an authenticated user', async () => {
    renderWithProviders(<App />, {
      route: '/people',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    expect(await screen.findByRole('heading', { name: 'Find people' })).toBeInTheDocument()
  })

  it('loads the protected create route for an authenticated user', async () => {
    renderWithProviders(<App />, {
      route: '/events/new',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    expect(await screen.findByRole('heading', { name: 'Create an event' })).toBeInTheDocument()
  })

  it('loads an event detail route on demand', async () => {
    renderWithProviders(<App />, { route: `/events/${eventPost.id}` })

    expect(await screen.findByRole('heading', { name: eventPost.title })).toBeInTheDocument()
  })

  it('loads a profile route on demand', async () => {
    renderWithProviders(<App />, { route: `/users/${eventOwner.id}` })

    expect(await screen.findByRole('heading', { name: eventOwner.username })).toBeInTheDocument()
  })
})
