import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { searchUsers } from '../api/users'
import { authenticatedTestUser, eventOwner } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { PeoplePage } from './PeoplePage'

vi.mock('../api/users', () => ({
  searchUsers: vi.fn(),
}))

const mockedSearchUsers = vi.mocked(searchUsers)
const authenticatedOptions = {
  auth: {
    user: authenticatedTestUser,
    token: 'test-token',
    isAuthenticated: true,
  },
}

beforeEach(() => {
  mockedSearchUsers.mockReset()
})

describe('PeoplePage', () => {
  it('searches users and links to their profile', async () => {
    const user = userEvent.setup()
    mockedSearchUsers.mockResolvedValue([eventOwner])
    renderWithProviders(<PeoplePage />, authenticatedOptions)

    await user.type(screen.getByLabelText('Search usernames'), 'london')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('heading', { name: eventOwner.username })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `View ${eventOwner.username}'s profile` })).toHaveAttribute(
      'href',
      `/users/${eventOwner.id}`,
    )
    expect(mockedSearchUsers).toHaveBeenCalledWith('london', 'test-token')
  })

  it('shows a clear empty result', async () => {
    const user = userEvent.setup()
    mockedSearchUsers.mockResolvedValue([])
    renderWithProviders(<PeoplePage />, authenticatedOptions)

    await user.type(screen.getByLabelText('Search usernames'), 'missing')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('heading', { name: 'No people found' })).toBeInTheDocument()
  })

  it('shows API errors without discarding the search form', async () => {
    const user = userEvent.setup()
    mockedSearchUsers.mockRejectedValue(new Error('Search is unavailable.'))
    renderWithProviders(<PeoplePage />, authenticatedOptions)

    await user.type(screen.getByLabelText('Search usernames'), 'london')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByRole('heading', { name: 'Search failed' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search usernames')).toBeInTheDocument()
  })
})
