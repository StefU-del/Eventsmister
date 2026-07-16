import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPosts, type Post } from './posts'

const post: Post = {
  id: 1,
  owner_id: 7,
  title: 'Spring Jazz Courtyard',
  description: 'Live music in a leafy courtyard.',
  category: 'Music',
  location: 'Camden',
  event_date: '2030-05-20T18:30:00Z',
  created_at: '2030-04-01T10:00:00Z',
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
    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8000/posts/', {
      headers: { Accept: 'application/json' },
      signal,
    })
  })

  it('reports unsuccessful HTTP responses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response)

    await expect(getPosts()).rejects.toThrow(
      'The events request failed with status 503.',
    )
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
})
