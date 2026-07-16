import { useState, type ImgHTMLAttributes } from 'react'

import fallbackImage from '../../assets/spring-jazz-courtyard.jpg'

type EventImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  imageUrl: string | null
}

export function EventImage({ imageUrl, alt, ...imageProps }: EventImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const source = imageUrl && failedUrl !== imageUrl ? imageUrl : fallbackImage

  return (
    <img
      {...imageProps}
      src={source}
      alt={alt}
      onError={() => setFailedUrl(imageUrl)}
    />
  )
}
