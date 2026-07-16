export function parseHashtags(value: string): string[] {
  const normalized = value
    .split(/[\s,]+/)
    .map((hashtag) => hashtag.trim().toLowerCase().replace(/^#/, ''))
    .filter((hashtag) => /^[a-z0-9][a-z0-9_-]{0,29}$/.test(hashtag))

  return Array.from(new Set(normalized)).slice(0, 8)
}
