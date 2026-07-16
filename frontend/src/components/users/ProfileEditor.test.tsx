import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadImage } from '../../api/uploads'
import { renderWithProviders } from '../../test/render'
import { ProfileEditor } from './ProfileEditor'

vi.mock('../../api/uploads', () => ({
  uploadImage: vi.fn(),
}))

const mockedUploadImage = vi.mocked(uploadImage)

const initialValue = {
  date_of_birth: null,
  interests: ['music'],
  profile_photo_url: null,
}

beforeEach(() => {
  mockedUploadImage.mockReset()
})

describe('ProfileEditor', () => {
  it('normalises profile values before saving', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    mockedUploadImage.mockResolvedValue('http://testserver/uploads/profile.jpg')
    renderWithProviders(
      <ProfileEditor
        initialValue={initialValue}
        isSaving={false}
        error={null}
        token="test-token"
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/Date of birth/), '1992-04-15')
    await user.upload(
      screen.getByLabelText('Profile photo'),
      new File(['profile-image'], 'profile.jpg', { type: 'image/jpeg' }),
    )
    expect(await screen.findByAltText('Profile photo preview')).toBeInTheDocument()
    await user.clear(screen.getByLabelText(/Interests/))
    await user.type(screen.getByLabelText(/Interests/), 'Music, food & drink, music')
    await user.click(screen.getByRole('button', { name: 'Save profile' }))

    expect(onSubmit).toHaveBeenCalledWith({
      date_of_birth: '1992-04-15',
      interests: ['music', 'food & drink'],
      profile_photo_url: 'http://testserver/uploads/profile.jpg',
    })
  })

  it('supports cancelling and presents saving errors', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    renderWithProviders(
      <ProfileEditor
        initialValue={initialValue}
        isSaving={false}
        error="Your profile could not be updated."
        token="test-token"
        onCancel={onCancel}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Your profile could not be updated.')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
