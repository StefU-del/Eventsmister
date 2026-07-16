import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useLocation } from 'react-router-dom'

import { authenticatedTestUser } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { SiteHeader } from './SiteHeader'

function CurrentLocation() {
  return <output data-testid="current-location">{useLocation().pathname}</output>
}

describe('SiteHeader', () => {
  it('shows guest actions and manages the compact navigation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SiteHeader />)

    expect(screen.getByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Join EventsMister' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'People' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Hearted' })).not.toBeInTheDocument()

    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    await user.click(menuButton)
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.click(screen.getByRole('link', { name: 'Discover' }))
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('shows authenticated actions and logs out', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()
    renderWithProviders(
      <>
        <SiteHeader />
        <CurrentLocation />
      </>,
      {
      route: `/users/${authenticatedTestUser.id}`,
      auth: {
        user: authenticatedTestUser,
        token: 'token',
        isAuthenticated: true,
        logout,
      },
      },
    )

    expect(screen.getByRole('link', { name: 'Create event' })).toHaveAttribute(
      'href',
      '/events/new',
    )
    expect(screen.getByRole('link', { name: authenticatedTestUser.username })).toHaveAttribute(
      'href',
      `/users/${authenticatedTestUser.id}`,
    )
    expect(screen.getByRole('link', { name: 'People' })).toHaveAttribute('href', '/people')
    expect(screen.getByRole('link', { name: 'Hearted' })).toHaveAttribute('href', '/hearted')

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
    expect(screen.getByTestId('current-location')).toHaveTextContent('/')
  })

  it('hides account actions while the session is restoring', () => {
    renderWithProviders(<SiteHeader />, { auth: { isReady: false } })

    expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Create event' })).not.toBeInTheDocument()
  })
})
