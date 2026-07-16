import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  getCurrentUser,
  getCurrentUserLikes,
  loginUser,
  registerUser,
  updateCurrentUserProfile,
} from '../api/auth'
import type {
  AuthenticatedUser,
  LoginInput,
  ProfileInput,
  RegisterInput,
} from '../api/types'
import { AuthContext, type LikeKind } from './AuthContext'

const TOKEN_STORAGE_KEY = 'eventsmister_access_token'

type SessionState = {
  token: string | null
  user: AuthenticatedUser | null
  likedPostIds: number[]
  likedCommentIds: number[]
  isReady: boolean
}

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(() => {
    const token = getStoredToken()
    return {
      token,
      user: null,
      likedPostIds: [],
      likedCommentIds: [],
      isReady: token === null,
    }
  })

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setSession({
      token: null,
      user: null,
      likedPostIds: [],
      likedCommentIds: [],
      isReady: true,
    })
  }, [])

  const hydrateSession = useCallback(async (token: string) => {
    // User and like data are loaded together so protected screens never see a partial session.
    const [user, likes] = await Promise.all([
      getCurrentUser(token),
      getCurrentUserLikes(token),
    ])
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setSession({
      token,
      user,
      likedPostIds: likes.post_ids,
      likedCommentIds: likes.comment_ids,
      isReady: true,
    })
  }, [])

  useEffect(() => {
    if (!session.token || session.user) {
      return
    }

    const token = session.token
    let isCurrent = true

    // Keep restoration inside the promise callbacks so an unmounted provider is never updated.
    Promise.all([getCurrentUser(token), getCurrentUserLikes(token)])
      .then(([user, likes]) => {
        if (!isCurrent) {
          return
        }
        setSession({
          token,
          user,
          likedPostIds: likes.post_ids,
          likedCommentIds: likes.comment_ids,
          isReady: true,
        })
      })
      .catch(() => {
        if (isCurrent) {
          clearSession()
        }
      })

    return () => {
      isCurrent = false
    }
  }, [clearSession, session.token, session.user])

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await loginUser(input)
      await hydrateSession(response.access_token)
    },
    [hydrateSession],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      await registerUser(input)
      await login({ username: input.username, password: input.password })
    },
    [login],
  )

  const updateLikedItem = useCallback((kind: LikeKind, id: number, liked: boolean) => {
    setSession((current) => {
      const key = kind === 'post' ? 'likedPostIds' : 'likedCommentIds'
      const currentIds = current[key]
      const nextIds = liked
        ? Array.from(new Set([...currentIds, id]))
        : currentIds.filter((currentId) => currentId !== id)

      return { ...current, [key]: nextIds }
    })
  }, [])

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      if (!session.token) {
        throw new Error('You must be logged in to update your profile.')
      }

      const user = await updateCurrentUserProfile(input, session.token)
      setSession((current) => ({ ...current, user }))
      return user
    },
    [session.token],
  )

  const value = useMemo(
    () => ({
      ...session,
      isAuthenticated: Boolean(session.token && session.user),
      login,
      register,
      updateProfile,
      logout: clearSession,
      updateLikedItem,
    }),
    [clearSession, login, register, session, updateLikedItem, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
