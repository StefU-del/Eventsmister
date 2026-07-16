/* eslint-disable react-refresh/only-export-components */
import { useState, type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AuthContext, type AuthContextValue, type LikeKind } from '../auth/AuthContext'
import { authenticatedTestUser } from './fixtures'

type ProviderOptions = {
  route?: string
  path?: string
  auth?: Partial<AuthContextValue>
}

function TestAuthProvider({
  children,
  overrides,
}: {
  children: ReactNode
  overrides?: Partial<AuthContextValue>
}) {
  const [likedPostIds, setLikedPostIds] = useState(overrides?.likedPostIds ?? [])
  const [likedCommentIds, setLikedCommentIds] = useState(overrides?.likedCommentIds ?? [])
  const user = overrides?.user === undefined ? null : overrides.user
  const token = overrides?.token === undefined ? null : overrides.token

  function updateLikedItem(kind: LikeKind, id: number, liked: boolean) {
    const update = (current: number[]) =>
      liked ? Array.from(new Set([...current, id])) : current.filter((currentId) => currentId !== id)

    if (kind === 'post') {
      setLikedPostIds(update)
    } else {
      setLikedCommentIds(update)
    }
    overrides?.updateLikedItem?.(kind, id, liked)
  }

  const baseValue: AuthContextValue = {
    user,
    token,
    isReady: true,
    isAuthenticated: Boolean(user && token),
    likedPostIds,
    likedCommentIds,
    login: async () => undefined,
    register: async () => undefined,
    updateProfile: async () => authenticatedTestUser,
    logout: () => undefined,
    updateLikedItem,
  }
  const value: AuthContextValue = {
    ...baseValue,
    ...overrides,
    likedPostIds,
    likedCommentIds,
    updateLikedItem,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path, auth, ...renderOptions }: ProviderOptions & RenderOptions = {},
) {
  const routedUi = path ? <Routes><Route path={path} element={ui} /></Routes> : ui

  return render(
    <MemoryRouter initialEntries={[route]}>
      <TestAuthProvider overrides={auth}>{routedUi}</TestAuthProvider>
    </MemoryRouter>,
    renderOptions,
  )
}
