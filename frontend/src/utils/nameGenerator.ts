export function generateRepoNames(
  baseName: string,
  count: number,
  startIndex: number,
  padding: number,
): string[] {
  if (!baseName.trim() || count <= 0) return []
  return Array.from({ length: count }, (_, i) => {
    const idx = startIndex + i
    return `${baseName}-${String(idx).padStart(padding, '0')}`
  })
}

export function parseRepoNamesList(raw: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (!seen.has(trimmed)) {
      seen.add(trimmed)
      result.push(trimmed)
    }
  }
  return result
}

export function parseUsernames(raw: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
    if (username && !seen.has(username)) {
      seen.add(username)
      result.push(username)
    }
  }
  return result
}

/** Custom List: `{templateRepo}-{username}` → e.g. ss-modules-next-StanislavTarasiuk */
export function buildRepoNamesFromUsernames(templateRepo: string, usernames: string[]): string[] {
  const prefix = templateRepo.trim()
  if (!prefix) return []
  return usernames.map(username => `${prefix}-${username}`)
}
