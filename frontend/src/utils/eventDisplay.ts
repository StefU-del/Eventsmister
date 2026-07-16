export const accentNames = ['mint', 'coral', 'sky', 'yellow'] as const

export type AccentName = (typeof accentNames)[number]

const dayFormatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit' })
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short' })
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: 'numeric',
  minute: '2-digit',
})

export function getAccent(postId: number): AccentName {
  return accentNames[postId % accentNames.length]
}

export function getEventDateParts(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return { day: '--', month: 'TBC', time: 'Time TBC' }
  }

  return {
    day: dayFormatter.format(date),
    month: monthFormatter.format(date),
    time: timeFormatter.format(date),
  }
}
