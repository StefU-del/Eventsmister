import { apiRequest } from './client'

type ImageUploadResponse = {
  url: string
}

export async function uploadImage(file: File, token: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiRequest<ImageUploadResponse>('/uploads/images', {
    method: 'POST',
    body: formData,
    token,
  })

  if (!response || typeof response.url !== 'string') {
    throw new Error('The image service returned an unexpected response.')
  }
  return response.url
}
