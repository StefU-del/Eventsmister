import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createPost } from '../api/posts'
import { uploadImage } from '../api/uploads'
import { authenticatedTestUser, eventPost } from '../test/fixtures'
import { renderWithProviders } from '../test/render'
import { CreateEventPage } from './CreateEventPage'

vi.mock('../api/posts', () => ({
  createPost: vi.fn(),
}))
vi.mock('../api/uploads', () => ({
  uploadImage: vi.fn(),
}))

const mockedCreatePost = vi.mocked(createPost)
const mockedUploadImage = vi.mocked(uploadImage)

beforeEach(() => {
  mockedCreatePost.mockReset()
  mockedUploadImage.mockReset()
})

describe('CreateEventPage', () => {
  it('publishes a valid event for the authenticated user', async () => {
    const user = userEvent.setup()
    mockedCreatePost.mockResolvedValue(eventPost)
    mockedUploadImage.mockResolvedValue('http://testserver/uploads/rooftop-film.jpg')
    renderWithProviders(<CreateEventPage />, {
      auth: {
        user: authenticatedTestUser,
        token: 'test-token',
        isAuthenticated: true,
      },
    })

    expect(screen.getByRole('option', { name: 'Sports' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Sport' })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Event title'), 'Rooftop film night')
    await user.type(
      screen.getByLabelText('Description'),
      'An outdoor screening with local food and plenty of seating.',
    )
    await user.selectOptions(screen.getByLabelText('Category'), 'Arts')
    await user.type(screen.getByLabelText('London location'), 'Peckham')
    await user.upload(
      screen.getByLabelText('Event photo'),
      new File(['event-image'], 'rooftop-film.jpg', { type: 'image/jpeg' }),
    )
    expect(await screen.findByAltText('Event photo preview')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Hashtags'), '#film #peckham film')
    await user.click(screen.getByRole('button', { name: 'Publish event' }))

    expect(mockedCreatePost).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Rooftop film night',
        category: 'Arts',
        location: 'Peckham',
        image_url: 'http://testserver/uploads/rooftop-film.jpg',
        hashtags: ['film', 'peckham'],
      }),
      'test-token',
    )
    expect(mockedUploadImage).toHaveBeenCalledWith(expect.any(File), 'test-token')
  })
})
