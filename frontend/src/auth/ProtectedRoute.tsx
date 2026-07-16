import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageState } from '../components/common/PageState'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return <PageState kind="loading" title="Restoring your session" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
