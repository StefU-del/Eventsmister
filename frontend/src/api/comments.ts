import { apiRequest } from './client'
import type { Comment, MessageResponse } from './types'

export function getComments(postId: number, signal?: AbortSignal) {
  return apiRequest<Comment[]>(`/posts/${postId}/comments`, { signal })
}

export function createComment(postId: number, content: string, token: string) {
  return apiRequest<Comment>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: { content },
    token,
  })
}

export function deleteComment(commentId: number, token: string) {
  return apiRequest<MessageResponse>(`/comments/${commentId}`, {
    method: 'DELETE',
    token,
  })
}
