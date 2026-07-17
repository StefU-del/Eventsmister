export type PublicUser = {
  id: number
  username: string
  interests: string[]
  profile_photo_url: string | null
  created_at: string
}

export type AuthenticatedUser = PublicUser & {
  email: string
  date_of_birth: string | null
}

export type Post = {
  id: number
  owner_id: number
  owner: PublicUser
  title: string
  description: string
  category: string
  location: string
  image_url: string | null
  hashtags: string[]
  event_date: string
  created_at: string
  like_count: number
  comment_count: number
}

export type ExternalEventSource = 'skiddle' | 'ticketmaster' | 'gemini'

export type ExternalEvent = {
  external_id: string
  source: ExternalEventSource
  source_name: string
  source_url: string
  source_logo_url: string | null
  title: string
  description: string
  category: string
  location: string
  image_url: string | null
  event_date: string
}

export type ExternalProviderStatus = {
  source: ExternalEventSource
  source_name: string
  enabled: boolean
  returned: number
  error: string | null
}

export type ExternalDiscovery = {
  events: ExternalEvent[]
  providers: ExternalProviderStatus[]
  terms: string[]
  search_suggestions_html: string | null
}

export type Comment = {
  id: number
  owner_id: number
  owner: PublicUser
  post_id: number
  content: string
  created_at: string
  like_count: number
}

export type LoginInput = {
  username: string
  password: string
}

export type RegisterInput = LoginInput & {
  email: string
}

export type PostInput = {
  title: string
  description: string
  category: string
  location: string
  image_url: string
  hashtags: string[]
  event_date: string
}

export type ProfileInput = {
  date_of_birth: string | null
  interests: string[]
  profile_photo_url: string | null
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type LikedItems = {
  post_ids: number[]
  comment_ids: number[]
}

export type LikeStatus = {
  message: string
  like_count: number
}

export type MessageResponse = {
  message: string
}
