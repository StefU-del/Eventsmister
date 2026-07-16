import type { AuthenticatedUser, Comment, Post, PublicUser } from '../api/types'

export const authenticatedTestUser: AuthenticatedUser = {
  id: 1,
  username: 'testlondoner',
  email: 'testlondoner@example.com',
  date_of_birth: '1995-06-12',
  interests: ['music', 'community'],
  profile_photo_url: 'https://example.com/test-profile.jpg',
  created_at: '2030-01-01T10:00:00Z',
}

export const eventOwner: PublicUser = {
  id: 7,
  username: 'londonlistener',
  interests: ['music'],
  profile_photo_url: null,
  created_at: '2030-03-01T10:00:00Z',
}

export const eventPost: Post = {
  id: 11,
  owner_id: eventOwner.id,
  owner: eventOwner,
  title: 'Spring Jazz Courtyard',
  description: 'Live music in a leafy courtyard with local performers.',
  category: 'Music',
  location: 'Camden',
  image_url: 'https://example.com/spring-jazz.jpg',
  hashtags: ['jazz', 'live-music'],
  event_date: '2030-05-20T18:30:00Z',
  created_at: '2030-04-01T10:00:00Z',
  like_count: 2,
  comment_count: 1,
}

export const eventComment: Comment = {
  id: 21,
  owner_id: authenticatedTestUser.id,
  owner: authenticatedTestUser,
  post_id: eventPost.id,
  content: 'This sounds excellent.',
  created_at: '2030-04-03T10:00:00Z',
  like_count: 1,
}
