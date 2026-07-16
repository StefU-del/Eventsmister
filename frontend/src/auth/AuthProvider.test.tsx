import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

import {
  getCurrentUser,
  getCurrentUserLikes,
  loginUser,
  registerUser,
  updateCurrentUserProfile,
} from '../api/auth'
import { authenticatedTestUser } from '../test/fixtures'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

vi.mock('../api/auth', () => ({
  getCurrentUser: vi.fn(),
  getCurrentUserLikes: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  updateCurrentUserProfile: vi.fn(),
}))

const mockedGetCurrentUser = vi.mocked(getCurrentUser)
const mockedGetCurrentUserLikes = vi.mocked(getCurrentUserLikes)
const mockedLoginUser = vi.mocked(loginUser)
const mockedRegisterUser = vi.mocked(registerUser)
const mockedUpdateCurrentUserProfile = vi.mocked(updateCurrentUserProfile)

function SessionHarness() {
  const auth = useAuth()

  return (
    <div>
      <output data-testid="ready">{String(auth.isReady)}</output>
      <output data-testid="authenticated">{String(auth.isAuthenticated)}</output>
      <output data-testid="username">{auth.user?.username ?? 'guest'}</output>
      <output data-testid="interests">{auth.user?.interests.join(',') ?? ''}</output>
      <output data-testid="post-likes">{auth.likedPostIds.join(',')}</output>
      <output data-testid="comment-likes">{auth.likedCommentIds.join(',')}</output>
      <button
        type="button"
        onClick={() => void auth.login({ username: 'testlondoner', password: 'Password123!' })}
      >
        Test login
      </button>
      <button
        type="button"
        onClick={() => void auth.register({
          username: 'testlondoner',
          email: 'test@example.com',
          password: 'Password123!',
        })}
      >
        Test registration
      </button>
      <button type="button" onClick={auth.logout}>Test logout</button>
      <button
        type="button"
        onClick={() => void auth.updateProfile({
          date_of_birth: '1992-04-15',
          interests: ['food', 'learning'],
          profile_photo_url: 'https://example.com/new-profile.jpg',
        })}
      >
        Update profile
      </button>
      <button type="button" onClick={() => auth.updateLikedItem('post', 12, true)}>
        Like post
      </button>
      <button type="button" onClick={() => auth.updateLikedItem('post', 12, false)}>
        Unlike post
      </button>
      <button type="button" onClick={() => auth.updateLikedItem('comment', 21, true)}>
        Like comment
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <SessionHarness />
    </AuthProvider>,
  )
}

beforeEach(() => {
  mockedGetCurrentUser.mockReset()
  mockedGetCurrentUserLikes.mockReset()
  mockedLoginUser.mockReset()
  mockedRegisterUser.mockReset()
  mockedUpdateCurrentUserProfile.mockReset()
  mockedGetCurrentUser.mockResolvedValue(authenticatedTestUser)
  mockedGetCurrentUserLikes.mockResolvedValue({ post_ids: [11], comment_ids: [20] })
  mockedLoginUser.mockResolvedValue({ access_token: 'fresh-token', token_type: 'bearer' })
  mockedRegisterUser.mockResolvedValue(authenticatedTestUser)
  mockedUpdateCurrentUserProfile.mockResolvedValue({
    ...authenticatedTestUser,
    interests: ['food', 'learning'],
    profile_photo_url: 'https://example.com/new-profile.jpg',
  })
})

describe('AuthProvider', () => {
  it('starts ready for a guest without a stored token', () => {
    renderProvider()

    expect(screen.getByTestId('ready')).toHaveTextContent('true')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('username')).toHaveTextContent('guest')
  })

  it('logs in, hydrates the session, updates likes, and logs out', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'Test login' }))
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    expect(mockedLoginUser).toHaveBeenCalledWith({
      username: 'testlondoner',
      password: 'Password123!',
    })
    expect(mockedGetCurrentUser).toHaveBeenCalledWith('fresh-token')
    expect(mockedGetCurrentUserLikes).toHaveBeenCalledWith('fresh-token')
    expect(window.localStorage.getItem('eventsmister_access_token')).toBe('fresh-token')
    expect(screen.getByTestId('post-likes')).toHaveTextContent('11')

    await user.click(screen.getByRole('button', { name: 'Update profile' }))
    await waitFor(() => {
      expect(screen.getByTestId('interests')).toHaveTextContent('food,learning')
    })
    expect(mockedUpdateCurrentUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({ interests: ['food', 'learning'] }),
      'fresh-token',
    )

    await user.click(screen.getByRole('button', { name: 'Like post' }))
    await user.click(screen.getByRole('button', { name: 'Like post' }))
    expect(screen.getByTestId('post-likes')).toHaveTextContent('11,12')

    await user.click(screen.getByRole('button', { name: 'Unlike post' }))
    await user.click(screen.getByRole('button', { name: 'Like comment' }))
    expect(screen.getByTestId('post-likes')).toHaveTextContent('11')
    expect(screen.getByTestId('comment-likes')).toHaveTextContent('20,21')

    await user.click(screen.getByRole('button', { name: 'Test logout' }))
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(window.localStorage.getItem('eventsmister_access_token')).toBeNull()
  })

  it('registers and then creates a normal authenticated session', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'Test registration' }))
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    expect(mockedRegisterUser).toHaveBeenCalledWith({
      username: 'testlondoner',
      email: 'test@example.com',
      password: 'Password123!',
    })
    expect(mockedLoginUser).toHaveBeenCalledWith({
      username: 'testlondoner',
      password: 'Password123!',
    })
  })

  it('restores a valid stored session', async () => {
    window.localStorage.setItem('eventsmister_access_token', 'stored-token')
    renderProvider()

    expect(screen.getByTestId('ready')).toHaveTextContent('false')
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    expect(mockedGetCurrentUser).toHaveBeenCalledWith('stored-token')
    expect(screen.getByTestId('username')).toHaveTextContent(authenticatedTestUser.username)
  })

  it('clears an invalid stored session', async () => {
    window.localStorage.setItem('eventsmister_access_token', 'expired-token')
    mockedGetCurrentUser.mockRejectedValue(new Error('Invalid token'))
    renderProvider()

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(window.localStorage.getItem('eventsmister_access_token')).toBeNull()
  })
})

describe('useAuth', () => {
  it('rejects use outside the provider boundary', () => {
    function MissingProvider() {
      useAuth()
      return null
    }

    expect(() => render(<MissingProvider />)).toThrow(
      'useAuth must be used within an AuthProvider',
    )
  })
})
