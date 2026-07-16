import { describe, expect, it } from 'vitest'

import { getAccent, getEventDateParts } from './eventDisplay'

describe('event display utilities', () => {
  it('cycles through the available event accents', () => {
    expect([1, 2, 3, 4, 5].map(getAccent)).toEqual([
      'coral',
      'sky',
      'yellow',
      'mint',
      'coral',
    ])
  })

  it('provides a fallback for invalid dates', () => {
    expect(getEventDateParts('not-a-date')).toEqual({
      day: '--',
      month: 'TBC',
      time: 'Time TBC',
    })
  })
})
