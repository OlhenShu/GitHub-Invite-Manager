export interface ParseIssueSpecResult {
  numbers: number[]
  invalidTokens: string[]
}

const TOKEN_SPLIT = /[\s,;]+/
const RANGE = /^(\d+)\s*[-–—]\s*(\d+)$/
const SINGLE = /^\d+$/
const MAX_RANGE = 500

/** Parse "1-5, 8, 12-15" or "#3 #7" into unique sorted issue numbers. */
export function parseIssueNumberSpec(raw: string): ParseIssueSpecResult {
  const numbers = new Set<number>()
  const invalidTokens: string[] = []

  for (const token of raw.split(TOKEN_SPLIT)) {
    const cleaned = token.trim().replace(/^#/, '')
    if (!cleaned || cleaned.toLowerCase() === 'all') continue

    const range = cleaned.match(RANGE)
    if (range) {
      let start = Number(range[1])
      let end = Number(range[2])
      if (start > end) [start, end] = [end, start]
      if (end - start > MAX_RANGE) {
        invalidTokens.push(token.trim())
        continue
      }
      for (let n = start; n <= end; n++) numbers.add(n)
      continue
    }

    if (SINGLE.test(cleaned)) {
      numbers.add(Number(cleaned))
      continue
    }

    invalidTokens.push(token.trim())
  }

  return { numbers: [...numbers].sort((a, b) => a - b), invalidTokens }
}

/** Compress [1,2,3,5,8,9] → "1-3, 5, 8-9". */
export function formatIssueNumberSpec(numbers: number[]): string {
  const unique = [...new Set(numbers)].filter(n => Number.isInteger(n) && n > 0).sort((a, b) => a - b)
  if (unique.length === 0) return ''

  const parts: string[] = []
  let start = unique[0]
  let prev = unique[0]

  for (let i = 1; i <= unique.length; i++) {
    const current = unique[i]
    if (current === prev + 1) {
      prev = current
      continue
    }
    parts.push(start === prev ? String(start) : `${start}-${prev}`)
    start = current
    prev = current
  }

  return parts.join(', ')
}
