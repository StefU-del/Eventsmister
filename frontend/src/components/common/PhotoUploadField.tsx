import { CheckCircle2, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

import { uploadImage } from '../../api/uploads'
import { getErrorMessage } from '../../utils/errors'
import styles from './PhotoUploadField.module.css'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type PhotoUploadFieldProps = {
  id: string
  label: string
  previewAlt: string
  token: string
  value: string | null
  required?: boolean
  shape?: 'landscape' | 'avatar'
  onChange: (url: string | null) => void
  onUploadingChange?: (isUploading: boolean) => void
}

export function PhotoUploadField({
  id,
  label,
  previewAlt,
  token,
  value,
  required = false,
  shape = 'landscape',
  onChange,
  onUploadingChange,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) {
      return
    }

    setError(null)
    setUploadedName(null)
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.')
      input.value = ''
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Choose an image that is 5 MB or smaller.')
      input.value = ''
      return
    }

    setIsUploading(true)
    onUploadingChange?.(true)
    try {
      const imageUrl = await uploadImage(file, token)
      setUploadedName(file.name)
      onChange(imageUrl)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'The photo could not be uploaded.'))
    } finally {
      input.value = ''
      setIsUploading(false)
      onUploadingChange?.(false)
    }
  }

  function removePhoto() {
    setUploadedName(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onChange(null)
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        ref={inputRef}
        className={styles.fileInput}
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        aria-label={label}
        required={required && !value}
        disabled={isUploading}
        onChange={handleFileChange}
      />
      <label className={styles.picker} htmlFor={id}>
        {isUploading ? (
          <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
        ) : (
          <ImagePlus size={18} aria-hidden="true" />
        )}
        {isUploading ? 'Uploading photo' : value ? 'Replace photo' : 'Choose photo'}
      </label>
      <small>JPEG, PNG, or WebP, up to 5 MB.</small>

      {value && (
        <div className={`${styles.preview} ${styles[shape]}`}>
          <img src={value} alt={previewAlt} />
          <button
            type="button"
            title={`Remove ${label.toLowerCase()}`}
            aria-label={`Remove ${label.toLowerCase()}`}
            disabled={isUploading}
            onClick={removePhoto}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {uploadedName && value && (
        <span className={styles.status} role="status" title={uploadedName}>
          <CheckCircle2 size={15} aria-hidden="true" />
          Photo uploaded
        </span>
      )}
      {error && <span className={styles.error} role="alert">{error}</span>}
    </div>
  )
}
