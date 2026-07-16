import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createPost,
  deletePost,
  getHeartedPosts,
  getPost,
  getPosts,
  type Post,
} from './posts'

const post: Post = {
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
  hashtags: ['jazz'],
  event_date: '2030-05-20T18:30:00Z',
  created_at: '2030-04-01T10:00:00Z',
  like_count: 2,
  comment_count: 1,
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('getPosts', () => {
  it('returns posts from the API', async () => {
    const signal = new AbortController().signal
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([post]),
    } as unknown as Response)

    await expect(getPosts(signal)).resolves.toEqual([post])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/posts/',
      expect.objectContaining({ signal }),
    )
    const requestOptions = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(requestOptions.headers).get('Accept')).toBe('application/json')
  })

  it('reports unsuccessful HTTP responses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response)

    await expect(getPosts()).rejects.toThrow('The request failed with status 503.')
  })

  it('rejects an unexpected response shape', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([{ ...post, id: 'one' }]),
    } as unknown as Response)

    await expect(getPosts()).rejects.toThrow(
      'The events service returned an unexpected response.',
    )
  })

  it('rejects posts with malformed owner data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([{ ...post, owner: null }]),
    } as unknown as Response)

    await expect(getPosts()).rejects.toThrow(
      'The events service returned an unexpected response.',
    )
  })
})

describe('individual post operations', () => {
  it('loads and validates authenticated hearted posts', async () => {
    const signal = new AbortController().signal
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([post]),
    } as unknown as Response)

    await expect(getHeartedPosts('token', signal)).resolves.toEqual([post])
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/auth/me/liked-posts',
      expect.objectContaining({ signal }),
    )
    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer token')
  })

  it('rejects malformed hearted posts', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([{ ...post, hashtags: null }]),
    } as unknown as Response)

    await expect(getHeartedPosts('token')).rejects.toThrow(
      'The events service returned an unexpected response.',
    )
  })

  it('loads and validates a single post', async () => {
    const signal = new AbortController().signal
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(post),
    } as unknown as Response)

    await expect(getPost(post.id, signal)).resolves.toEqual(post)
    expect(fetchMock).toHaveBeenCalledWith(
      `http://127.0.0.1:8000/posts/${post.id}`,
      expect.objectContaining({ signal }),
    )
  })

  it('rejects a malformed single post', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(null),
    } as unknown as Response)

    await expect(getPost(post.id)).rejects.toThrow(
      'The events service returned an unexpected response.',
    )
  })

  it('creates an authenticated post', async () => {
    const input = {
      title: post.title,
      description: post.description,
      category: post.category,
      location: post.location,
      image_url: post.image_url ?? '',
      hashtags: post.hashtags,
      event_date: post.event_date,
    }
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(post),
    } as unknown as Response)

    await expect(createPost(input, 'token')).resolves.toEqual(post)
    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify(input))
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer token')
  })

  it('deletes an authenticated post', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ message: 'Post deleted successfully' }),
    } as unknown as Response)

    await expect(deletePost(post.id, 'token')).resolves.toEqual({
      message: 'Post deleted successfully',
    })
    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.method).toBe('DELETE')
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer token')
  })
})
