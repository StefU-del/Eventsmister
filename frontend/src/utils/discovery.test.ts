import { describe, expect, it } from 'vitest'

import { eventPost } from '../test/fixtures'
import { parseHashtags } from './hashtags'
import { parseInterests } from './interests'
import { getRecommendedPosts, getRecommendationScore } from './recommendations'

describe('discovery data helpers', () => {
  it('normalises, validates, deduplicates, and limits hashtags', () => {
    expect(
      parseHashtags('#Music, local #MUSIC invalid! one two three four five six seven eight'),
    ).toEqual(['music', 'local', 'one', 'two', 'three', 'four', 'five', 'six'])
  })

  it('normalises, validates, deduplicates, and limits interests', () => {
    expect(
      parseInterests(
        ' Live Music, live music, food & drink, invalid!, one, two, three, four, five, six, seven, eight, nine ',
      ),
    ).toEqual([
      'live music',
      'food & drink',
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
    ])
  })

  it('scores category and hashtag matches', () => {
    expect(getRecommendationScore(eventPost, [' Music ', 'jazz'])).toBe(5)
    expect(getRecommendationScore(eventPost, ['food'])).toBe(0)
  })

  it('orders recommendations by score then date and respects the limit', () => {
    const earlierHashtagMatch = {
      ...eventPost,
      id: 12,
      category: 'Arts',
      event_date: '2030-05-10T18:00:00Z',
    }
    const earlierCategoryMatch = {
      ...eventPost,
      id: 13,
      hashtags: [],
      event_date: '2030-05-01T18:00:00Z',
    }
    const laterCategoryMatch = {
      ...earlierCategoryMatch,
      id: 14,
      event_date: '2030-06-01T18:00:00Z',
    }

    expect(
      getRecommendedPosts(
        [laterCategoryMatch, earlierHashtagMatch, eventPost, earlierCategoryMatch],
        ['music', 'jazz'],
        3,
      ).map((post) => post.id),
    ).toEqual([eventPost.id, earlierCategoryMatch.id, laterCategoryMatch.id])
    expect(getRecommendedPosts([eventPost], ['food'])).toEqual([])
  })
})
