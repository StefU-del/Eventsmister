import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from './client'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

describe('apiRequest', () => {
  it('serialises JSON and attaches authentication headers', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ id: 4 }),
    } as unknown as Response)

    await expect(
      apiRequest<{ id: number }>('/resource', {
        method: 'POST',
        body: { title: 'An event' },
        token: 'access-token',
        headers: { 'X-Request-ID': 'request-1' },
      }),
    ).resolves.toEqual({ id: 4 })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(options.headers)
    expect(url).toBe('http://127.0.0.1:8000/resource')
    expect(options.body).toBe(JSON.stringify({ title: 'An event' }))
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Authorization')).toBe('Bearer access-token')
    expect(headers.get('X-Request-ID')).toBe('request-1')
  })

  it('sends FormData without overriding its multipart content type', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ url: '/uploads/image.png' }),
    } as unknown as Response)
    const formData = new FormData()
    formData.append('file', new File(['image'], 'image.png', { type: 'image/png' }))

    await apiRequest('/uploads/images', {
      method: 'POST',
      body: formData,
      token: 'access-token',
    })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(options.headers)
    expect(options.body).toBe(formData)
    expect(headers.get('Content-Type')).toBeNull()
    expect(headers.get('Authorization')).toBe('Bearer access-token')
  })

  it('returns an empty payload for a successful 204 response', async () => {
    const json = vi.fn()
    fetchMock.mockResolvedValue({ ok: true, status: 204, json } as unknown as Response)

    await expect(apiRequest('/resource', { method: 'DELETE' })).resolves.toBeNull()
    expect(json).not.toHaveBeenCalled()
  })

  it('uses string error details returned by FastAPI', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ detail: 'Username already exists' }),
    } as unknown as Response)

    await expect(apiRequest('/auth/register')).rejects.toMatchObject({
      message: 'Username already exists',
      status: 400,
    })
  })

  it('combines FastAPI validation messages', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({
        detail: [{ msg: 'Title is too short' }, { ignored: true }, { msg: 'Date is invalid' }],
      }),
    } as unknown as Response)

    await expect(apiRequest('/posts/')).rejects.toThrow(
      'Title is too short Date is invalid',
    )
  })

  it('falls back to the HTTP status for an unfamiliar error payload', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn().mockResolvedValue({ detail: [] }),
    } as unknown as Response)

    await expect(apiRequest('/posts/')).rejects.toThrow(
      'The request failed with status 503.',
    )
  })

  it('reports malformed successful responses', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
    } as unknown as Response)

    await expect(apiRequest('/posts/')).rejects.toThrow(
      'The event service returned an unexpected response.',
    )
  })

  it('reports network failures with status zero', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(apiRequest('/posts/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
    })
  })

  it('preserves abort errors so callers can ignore cancelled requests', async () => {
    const abortError = new DOMException('Request aborted', 'AbortError')
    fetchMock.mockRejectedValue(abortError)

    await expect(apiRequest('/posts/')).rejects.toBe(abortError)
  })
})
