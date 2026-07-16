import { Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError } from '../api/client'
import type { Post, PublicUser } from '../api/types'
import { getUser, getUserPosts } from '../api/users'
import { useAuth } from '../auth/useAuth'
import { PageState } from '../components/common/PageState'
import { EventGrid } from '../components/events/EventGrid'
import { ProfileAvatar } from '../components/users/ProfileAvatar'
import { ProfileEditor } from '../components/users/ProfileEditor'
import { formatMemberSince } from '../utils/eventDisplay'
import { getErrorMessage } from '../utils/errors'
import pageStyles from './Page.module.css'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { userId } = useParams()
  const numericUserId = Number(userId)
  const isValidUserId = Number.isInteger(numericUserId) && numericUserId > 0
  const { token, updateProfile, user: currentUser } = useAuth()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isNotFound, setIsNotFound] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!isValidUserId) {
      return
    }

    const controller = new AbortController()
    Promise.all([
      getUser(numericUserId, controller.signal),
      getUserPosts(numericUserId, controller.signal),
    ])
      .then(([loadedUser, loadedPosts]) => {
        setProfile(loadedUser)
        setPosts(loadedPosts)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setIsNotFound(error instanceof ApiError && error.status === 404)
        setLoadError(getErrorMessage(error, 'This profile could not be loaded.'))
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [isValidUserId, numericUserId])

  if (!isValidUserId || isNotFound) {
    return (
      <section className={pageStyles.page}>
        <PageState
          kind="notFound"
          title="Profile not found"
          message="This user may no longer have an account."
          action={<Link className={pageStyles.primaryLink} to="/people">Find people</Link>}
        />
      </section>
    )
  }

  if (isLoading) {
    return <section className={pageStyles.page}><PageState kind="loading" title="Loading profile" /></section>
  }

  if (loadError || !profile) {
    return <section className={pageStyles.page}><PageState kind="error" title="Profile could not load" message={loadError ?? undefined} /></section>
  }

  const isOwnProfile = currentUser?.id === profile.id

  async function handleProfileUpdate(input: Parameters<typeof updateProfile>[0]) {
    setIsSaving(true)
    setProfileError(null)
    try {
      const updatedUser = await updateProfile(input)
      setProfile(updatedUser)
      setIsEditing(false)
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Your profile could not be updated.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={pageStyles.page}>
      <header className={styles.profileHeader}>
        <ProfileAvatar
          username={profile.username}
          photoUrl={profile.profile_photo_url}
          size="large"
          decorative
        />
        <div className={styles.profileCopy}>
          <span>{isOwnProfile ? 'Your profile' : 'Community member'}</span>
          <h1>{profile.username}</h1>
          <p>{formatMemberSince(profile.created_at)}</p>
          {profile.interests.length > 0 && (
            <ul className={styles.interests} aria-label={`${profile.username}'s interests`}>
              {profile.interests.map((interest) => <li key={interest}>{interest}</li>)}
            </ul>
          )}
        </div>
        {isOwnProfile && (
          <div className={styles.profileActions}>
            <button
              className={pageStyles.secondaryButton}
              type="button"
              onClick={() => setIsEditing((current) => !current)}
            >
              <Pencil size={16} aria-hidden="true" />
              Edit profile
            </button>
            <Link className={pageStyles.primaryLink} to="/events/new">
              <Plus size={17} aria-hidden="true" />
              Create event
            </Link>
          </div>
        )}
      </header>

      {isOwnProfile && isEditing && currentUser && token && (
        <ProfileEditor
          initialValue={{
            date_of_birth: currentUser.date_of_birth,
            interests: currentUser.interests,
            profile_photo_url: currentUser.profile_photo_url,
          }}
          isSaving={isSaving}
          error={profileError}
          token={token}
          onCancel={() => setIsEditing(false)}
          onSubmit={handleProfileUpdate}
        />
      )}

      <div className={styles.eventsHeading}>
        <h2>{isOwnProfile ? 'Your events' : `Events by ${profile.username}`}</h2>
        <span>{posts.length} {posts.length === 1 ? 'event' : 'events'}</span>
      </div>

      {posts.length === 0 ? (
        <PageState
          kind="empty"
          title={isOwnProfile ? 'You have not shared an event yet' : 'No events shared yet'}
          message={isOwnProfile ? 'Create your first event and it will appear here.' : undefined}
          action={isOwnProfile ? <Link className={pageStyles.primaryLink} to="/events/new">Create event</Link> : undefined}
          compact
        />
      ) : (
        <EventGrid posts={posts} />
      )}
    </section>
  )
}
