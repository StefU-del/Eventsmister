export type Post = {
  id: number
  owner_id: number
  title: string
  description: string
  category: string
  location: string
  event_date: string
  created_at: string
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
).replace(/\/$/, '')

function isPost(value: unknown): value is Post {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const post = value as Record<string, unknown>

  return (
    typeof post.id === 'number' &&
    typeof post.owner_id === 'number' &&
    typeof post.title === 'string' &&
    typeof post.description === 'string' &&
    typeof post.category === 'string' &&
    typeof post.location === 'string' &&
    typeof post.event_date === 'string' &&
    typeof post.created_at === 'string'
  )
}

export async function getPosts(signal?: AbortSignal): Promise<Post[]> {
  const response = await fetch(`${API_BASE_URL}/posts/`, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`The events request failed with status ${response.status}.`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data) || !data.every(isPost)) {
    throw new Error('The events service returned an unexpected response.')
  }

  return data
}
