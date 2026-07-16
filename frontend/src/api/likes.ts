import { apiRequest } from './client'
import type { LikeStatus } from './types'

export type LikeResource = 'post' | 'comment'

export function setLike(
  resource: LikeResource,
  resourceId: number,
  liked: boolean,
  token: string,
) {
  const path = resource === 'post' ? 'posts' : 'comments'
  return apiRequest<LikeStatus>(`/${path}/${resourceId}/like`, {
    method: liked ? 'DELETE' : 'POST',
    token,
  })
}
