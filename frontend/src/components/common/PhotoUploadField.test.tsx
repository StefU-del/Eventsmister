import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { uploadImage } from '../../api/uploads'
import { PhotoUploadField } from './PhotoUploadField'

vi.mock('../../api/uploads', () => ({
  uploadImage: vi.fn(),
}))

const mockedUploadImage = vi.mocked(uploadImage)

function renderField(overrides: Partial<Parameters<typeof PhotoUploadField>[0]> = {}) {
  const props = {
    id: 'test-photo',
    label: 'Event photo',
    previewAlt: 'Event photo preview',
    token: 'test-token',
    value: null,
    onChange: vi.fn(),
    ...overrides,
  }
  return { ...render(<PhotoUploadField {...props} />), props }
}

beforeEach(() => {
  mockedUploadImage.mockReset()
})

describe('PhotoUploadField', () => {
  it('uploads, previews, and removes a selected image', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onUploadingChange = vi.fn()
    mockedUploadImage.mockResolvedValue('http://testserver/uploads/event.png')
    const { rerender } = renderField({ onChange, onUploadingChange })
    const file = new File(['image'], 'event.png', { type: 'image/png' })

    await user.upload(screen.getByLabelText('Event photo'), file)

    expect(mockedUploadImage).toHaveBeenCalledWith(file, 'test-token')
    expect(onUploadingChange).toHaveBeenNthCalledWith(1, true)
    expect(onUploadingChange).toHaveBeenLastCalledWith(false)
    expect(onChange).toHaveBeenCalledWith('http://testserver/uploads/event.png')

    rerender(
      <PhotoUploadField
        id="test-photo"
        label="Event photo"
        previewAlt="Event photo preview"
        token="test-token"
        value="http://testserver/uploads/event.png"
        onChange={onChange}
      />,
    )
    expect(screen.getByAltText('Event photo preview')).toHaveAttribute(
      'src',
      'http://testserver/uploads/event.png',
    )
    await user.click(screen.getByRole('button', { name: 'Remove event photo' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('rejects unsupported and oversized files before making a request', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderField()
    const input = screen.getByLabelText('Event photo')

    await user.upload(input, new File(['text'], 'notes.txt', { type: 'text/plain' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG, PNG, or WebP image.')

    const oversized = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      'large.png',
      { type: 'image/png' },
    )
    await user.upload(input, oversized)
    expect(screen.getByRole('alert')).toHaveTextContent('5 MB or smaller')
    expect(mockedUploadImage).not.toHaveBeenCalled()
  })

  it('presents backend upload failures', async () => {
    const user = userEvent.setup()
    mockedUploadImage.mockRejectedValue(new Error('Upload service unavailable.'))
    renderField()

    await user.upload(
      screen.getByLabelText('Event photo'),
      new File(['image'], 'event.webp', { type: 'image/webp' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Upload service unavailable.')
  })
})
