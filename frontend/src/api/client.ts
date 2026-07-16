const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
).replace(/\/$/, '')

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== 'object' || payload === null || !('detail' in payload)) {
    return fallback
  }

  const detail = payload.detail
  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        typeof item === 'object' && item !== null && 'msg' in item
          ? String(item.msg)
          : null,
      )
      .filter((message): message is string => message !== null)

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  return fallback
}

export async function apiRequest<T>(
  path: string,
  { body, token, headers, ...requestOptions }: ApiRequestOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', 'application/json')
  const isFormData = body instanceof FormData

  if (body !== undefined && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(
      'We could not reach the event service. Check that the backend is running.',
      0,
    )
  }

  let payload: unknown = null
  if (response.status !== 204) {
    try {
      payload = await response.json()
    } catch {
      if (response.ok) {
        throw new ApiError('The event service returned an unexpected response.', response.status)
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(payload, `The request failed with status ${response.status}.`),
      response.status,
    )
  }

  return payload as T
}
