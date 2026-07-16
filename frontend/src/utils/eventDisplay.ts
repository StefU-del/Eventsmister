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

const fullDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const memberDateFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
})

export function formatFullEventDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date and time to be confirmed' : fullDateFormatter.format(date)
}

export function formatMemberSince(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Recently joined' : `Member since ${memberDateFormatter.format(date)}`
}

export function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function toLocalDateTimeInput(date: Date) {
  // datetime-local expects wall-clock time rather than a UTC ISO timestamp.
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localTime.toISOString().slice(0, 16)
}

export function getMinimumEventDate() {
  return toLocalDateTimeInput(new Date())
}

export function getDefaultEventDate() {
  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 7)
  defaultDate.setHours(19, 0, 0, 0)
  return toLocalDateTimeInput(defaultDate)
}
