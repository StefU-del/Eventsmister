import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCurrentUser,
  getCurrentUserLikes,
  loginUser,
  registerUser,
  updateCurrentUserProfile,
} from './auth'
import { apiRequest } from './client'
import { createComment, deleteComment, getComments } from './comments'
import { setLike } from './likes'
import { uploadImage } from './uploads'
import { getUser, getUserPosts, searchUsers } from './users'

vi.mock('./client', () => ({ apiRequest: vi.fn() }))

const requestMock = vi.mocked(apiRequest)

beforeEach(() => {
  requestMock.mockReset()
  requestMock.mockResolvedValue({} as never)
})

describe('API resource modules', () => {
  it('constructs each authentication request', () => {
    const registration = {
      username: 'new_user',
      email: 'new@example.com',
      password: 'Password123!',
    }
    const login = { username: registration.username, password: registration.password }
    const profile = {
      date_of_birth: '1990-05-12',
      interests: ['music'],
      profile_photo_url: 'https://example.com/profile.jpg',
    }

    registerUser(registration)
    loginUser(login)
    getCurrentUser('token')
    getCurrentUserLikes('token')
    updateCurrentUserProfile(profile, 'token')

    expect(requestMock).toHaveBeenNthCalledWith(1, '/auth/register', {
      method: 'POST',
      body: registration,
    })
    expect(requestMock).toHaveBeenNthCalledWith(2, '/auth/login', {
      method: 'POST',
      body: login,
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/auth/me', { token: 'token' })
    expect(requestMock).toHaveBeenNthCalledWith(4, '/auth/me/likes', { token: 'token' })
    expect(requestMock).toHaveBeenNthCalledWith(5, '/auth/me', {
      method: 'PATCH',
      body: profile,
      token: 'token',
    })
  })

  it('constructs comment requests', () => {
    const signal = new AbortController().signal

    getComments(7, signal)
    createComment(7, 'See you there.', 'token')
    deleteComment(9, 'token')

    expect(requestMock).toHaveBeenNthCalledWith(1, '/posts/7/comments', { signal })
    expect(requestMock).toHaveBeenNthCalledWith(2, '/posts/7/comments', {
      method: 'POST',
      body: { content: 'See you there.' },
      token: 'token',
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/comments/9', {
      method: 'DELETE',
      token: 'token',
    })
  })

  it('constructs encoded user requests', () => {
    const signal = new AbortController().signal

    searchUsers('name with spaces', 'token', signal)
    getUser(3, signal)
    getUserPosts(3, signal)

    expect(requestMock).toHaveBeenNthCalledWith(
      1,
      '/users/search?query=name%20with%20spaces',
      { signal, token: 'token' },
    )
    expect(requestMock).toHaveBeenNthCalledWith(2, '/users/3', { signal })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/users/3/posts', { signal })
  })

  it('constructs a multipart image upload request', async () => {
    const file = new File(['image'], 'event.png', { type: 'image/png' })
    requestMock.mockResolvedValueOnce({ url: 'http://testserver/uploads/event.png' })

    await expect(uploadImage(file, 'token')).resolves.toBe(
      'http://testserver/uploads/event.png',
    )

    expect(requestMock).toHaveBeenCalledWith('/uploads/images', {
      method: 'POST',
      body: expect.any(FormData),
      token: 'token',
    })
    const options = requestMock.mock.calls[0][1]
    expect((options?.body as FormData).get('file')).toBe(file)
  })

  it('rejects malformed upload responses', async () => {
    requestMock.mockResolvedValueOnce({} as never)

    await expect(
      uploadImage(new File(['image'], 'event.png', { type: 'image/png' }), 'token'),
    ).rejects.toThrow('The image service returned an unexpected response.')
  })

  it.each([
    ['post', 4, false, '/posts/4/like', 'POST'],
    ['post', 4, true, '/posts/4/like', 'DELETE'],
    ['comment', 8, false, '/comments/8/like', 'POST'],
    ['comment', 8, true, '/comments/8/like', 'DELETE'],
  ] as const)('constructs %s like requests', (resource, id, liked, path, method) => {
    setLike(resource, id, liked, 'token')

    expect(requestMock).toHaveBeenCalledWith(path, { method, token: 'token' })
  })
})
