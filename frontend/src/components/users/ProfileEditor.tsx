import { LoaderCircle, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { ProfileInput } from '../../api/types'
import { PhotoUploadField } from '../common/PhotoUploadField'
import { parseInterests } from '../../utils/interests'
import styles from './ProfileEditor.module.css'

type ProfileEditorProps = {
  initialValue: ProfileInput
  isSaving: boolean
  error: string | null
  token: string
  onCancel: () => void
  onSubmit: (input: ProfileInput) => Promise<void>
}

export function ProfileEditor({
  initialValue,
  isSaving,
  error,
  token,
  onCancel,
  onSubmit,
}: ProfileEditorProps) {
  const [dateOfBirth, setDateOfBirth] = useState(initialValue.date_of_birth ?? '')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    initialValue.profile_photo_url ?? '',
  )
  const [interests, setInterests] = useState(initialValue.interests.join(', '))
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit({
      date_of_birth: dateOfBirth || null,
      interests: parseInterests(interests),
      profile_photo_url: profilePhotoUrl.trim() || null,
    })
  }

  return (
    <form className={styles.editor} onSubmit={handleSubmit}>
      <div className={styles.fieldGrid}>
        <label>
          Date of birth
          <input
            type="date"
            value={dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
          <small>Private and only visible to you.</small>
        </label>
        <PhotoUploadField
          id="profile-photo"
          label="Profile photo"
          previewAlt="Profile photo preview"
          token={token}
          value={profilePhotoUrl || null}
          shape="avatar"
          onChange={(imageUrl) => setProfilePhotoUrl(imageUrl ?? '')}
          onUploadingChange={setIsUploadingPhoto}
        />
      </div>
      <label>
        Interests
        <input
          value={interests}
          maxLength={309}
          placeholder="music, community, food, tech"
          onChange={(event) => setInterests(event.target.value)}
        />
        <small>Up to ten comma-separated interests improve your event suggestions.</small>
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="button" disabled={isSaving || isUploadingPhoto} onClick={onCancel}>Cancel</button>
        <button
          className={styles.saveButton}
          type="submit"
          disabled={isSaving || isUploadingPhoto}
        >
          {isSaving ? (
            <LoaderCircle className={styles.spinner} size={17} aria-hidden="true" />
          ) : (
            <Save size={17} aria-hidden="true" />
          )}
          {isSaving ? 'Saving' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
