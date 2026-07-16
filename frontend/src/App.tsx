import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { DiscoverPage } from './pages/DiscoverPage'

// Discovery stays eager; secondary routes become separate production chunks.
const CreateEventPage = lazy(() =>
  import('./pages/CreateEventPage').then((module) => ({ default: module.CreateEventPage })),
)
const EventDetailPage = lazy(() =>
  import('./pages/EventDetailPage').then((module) => ({ default: module.EventDetailPage })),
)
const HeartedEventsPage = lazy(() =>
  import('./pages/HeartedEventsPage').then((module) => ({ default: module.HeartedEventsPage })),
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const PeoplePage = lazy(() =>
  import('./pages/PeoplePage').then((module) => ({ default: module.PeoplePage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
)

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DiscoverPage />} />
        <Route path="events/:postId" element={<EventDetailPage />} />
        <Route path="users/:userId" element={<ProfilePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="hearted" element={<HeartedEventsPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="events/new" element={<CreateEventPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
