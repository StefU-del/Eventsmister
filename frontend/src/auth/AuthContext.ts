import { createContext } from 'react'

import type { LoginInput, ProfileInput, RegisterInput } from '../api/types'
import type { AuthenticatedUser } from '../api/types'

export type LikeKind = 'post' | 'comment'

export type AuthContextValue = {
  user: AuthenticatedUser | null
  token: string | null
  isReady: boolean
  isAuthenticated: boolean
  likedPostIds: number[]
  likedCommentIds: number[]
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  updateProfile: (input: ProfileInput) => Promise<AuthenticatedUser>
  logout: () => void
  updateLikedItem: (kind: LikeKind, id: number, liked: boolean) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
