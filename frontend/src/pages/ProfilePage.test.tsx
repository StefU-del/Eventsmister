import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { uploadImage } from '../api/uploads'
import { getUser, getUserPosts } from '../api/users'
import { authenticatedTestUser, eventOwner, eventPost } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { ProfilePage } from './ProfilePage'

vi.mock('../api/users', () => ({
  getUser: vi.fn(),
  getUserPosts: vi.fn(),
}))
vi.mock('../api/uploads', () => ({
  uploadImage: vi.fn(),
}))

const mockedGetUser = vi.mocked(getUser)
const mockedGetUserPosts = vi.mocked(getUserPosts)
const mockedUploadImage = vi.mocked(uploadImage)

beforeEach(() => {
  mockedGetUser.mockReset()
  mockedGetUserPosts.mockReset()
  mockedUploadImage.mockReset()
})

describe('ProfilePage', () => {
  it('renders a public profile and its events', async () => {
    mockedGetUser.mockResolvedValue(eventOwner)
    mockedGetUserPosts.mockResolvedValue([eventPost])

    renderWithProviders(<ProfilePage />, {
      route: `/users/${eventOwner.id}`,
      path: '/users/:userId',
    })

    expect(await screen.findByRole('heading', { name: eventOwner.username })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: eventPost.title })).toBeInTheDocument()
  })

  it('lets the owner update private and public profile details', async () => {
    const user = userEvent.setup()
    mockedUploadImage.mockResolvedValue('http://testserver/uploads/updated-profile.jpg')
    const updateProfile = vi.fn().mockResolvedValue({
      ...authenticatedTestUser,
      interests: ['arts', 'food'],
      profile_photo_url: 'https://example.com/updated-profile.jpg',
    })
    mockedGetUser.mockResolvedValue(authenticatedTestUser)
    mockedGetUserPosts.mockResolvedValue([])

    renderWithProviders(<ProfilePage />, {
      route: `/users/${authenticatedTestUser.id}`,
      path: '/users/:userId',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
        updateProfile,
      },
    })

    expect(await screen.findByText('Your profile')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit profile' }))
    await user.clear(screen.getByLabelText(/Interests/))
    await user.type(screen.getByLabelText(/Interests/), 'Arts, food, arts')
    await user.upload(
      screen.getByLabelText('Profile photo'),
      new File(['updated-profile'], 'updated-profile.jpg', { type: 'image/jpeg' }),
    )
    expect(await screen.findByAltText('Profile photo preview')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(updateProfile).toHaveBeenCalledWith({
      date_of_birth: authenticatedTestUser.date_of_birth,
      interests: ['arts', 'food'],
      profile_photo_url: 'http://testserver/uploads/updated-profile.jpg',
    })
    expect(await screen.findByText('arts')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'You have not shared an event yet' })).toBeInTheDocument()
  })

  it('keeps the editor open when a profile update fails', async () => {
    const user = userEvent.setup()
    const updateProfile = vi.fn().mockRejectedValue(new Error('Save unavailable.'))
    mockedGetUser.mockResolvedValue(authenticatedTestUser)
    mockedGetUserPosts.mockResolvedValue([])

    renderWithProviders(<ProfilePage />, {
      route: `/users/${authenticatedTestUser.id}`,
      path: '/users/:userId',
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
        updateProfile,
      },
    })

    await screen.findByText('Your profile')
    await user.click(screen.getByRole('button', { name: 'Edit profile' }))
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable.')
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeInTheDocument()
  })

  it('shows loading and not-found states', async () => {
    mockedGetUser.mockRejectedValue(new ApiError('Missing', 404))
    mockedGetUserPosts.mockResolvedValue([])

    renderWithProviders(<ProfilePage />, {
      route: '/users/999',
      path: '/users/:userId',
    })

    expect(screen.getByRole('heading', { name: 'Loading profile' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Profile not found' })).toBeInTheDocument()
  })

  it('rejects malformed profile identifiers without making a request', () => {
    renderWithProviders(<ProfilePage />, {
      route: '/users/not-a-number',
      path: '/users/:userId',
    })

    expect(screen.getByRole('heading', { name: 'Profile not found' })).toBeInTheDocument()
    expect(mockedGetUser).not.toHaveBeenCalled()
  })

  it('shows service errors separately from missing profiles', async () => {
    mockedGetUser.mockRejectedValue(new Error('Service unavailable.'))
    mockedGetUserPosts.mockResolvedValue([])

    renderWithProviders(<ProfilePage />, {
      route: '/users/7',
      path: '/users/:userId',
    })

    expect(
      await screen.findByRole('heading', { name: 'Profile could not load' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Service unavailable.')).toBeInTheDocument()
  })
})
