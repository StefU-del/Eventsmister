import type { Post } from '../api/types'

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function getRecommendationScore(post: Post, interests: string[]): number {
  const normalizedInterests = new Set(interests.map(normalize))
  const categoryMatch = normalizedInterests.has(normalize(post.category)) ? 3 : 0
  const hashtagMatches = post.hashtags.filter((hashtag) =>
    normalizedInterests.has(normalize(hashtag)),
  ).length

  return categoryMatch + hashtagMatches * 2
}

export function getRecommendedPosts(posts: Post[], interests: string[], limit = 3): Post[] {
  return posts
    .map((post) => ({ post, score: getRecommendationScore(post, interests) }))
    .filter(({ score }) => score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        new Date(first.post.event_date).getTime() - new Date(second.post.event_date).getTime(),
    )
    .slice(0, limit)
    .map(({ post }) => post)
}
