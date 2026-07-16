export function parseInterests(value: string): string[] {
  const normalized = value
    .split(',')
    .map((interest) => interest.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter((interest) => /^[a-z0-9][a-z0-9 &_-]{0,29}$/.test(interest))

  return Array.from(new Set(normalized)).slice(0, 10)
}
