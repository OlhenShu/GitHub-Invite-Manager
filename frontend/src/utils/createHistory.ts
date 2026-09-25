const STORAGE_KEY = 'gim.create-history'
const MAX_ITEMS = 80

export interface RecentTemplate {
  owner: string
  repo: string
}

export interface CreateHistory {
  templates: RecentTemplate[]
  orgs: string[]
}

function emptyHistory(): CreateHistory {
  return { templates: [], orgs: [] }
}

export function loadCreateHistory(): CreateHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyHistory()
    const parsed = JSON.parse(raw) as Partial<CreateHistory>
    const templates = Array.isArray(parsed.templates)
      ? parsed.templates.filter(t => t && typeof t.owner === 'string' && typeof t.repo === 'string')
      : []
    const orgs = Array.isArray(parsed.orgs)
      ? parsed.orgs.filter(org => typeof org === 'string' && org.trim())
      : []
    return { templates, orgs }
  } catch {
    return emptyHistory()
  }
}

function saveCreateHistory(history: CreateHistory): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function rememberCreateTarget(template: RecentTemplate, org?: string): CreateHistory {
  const owner = template.owner.trim()
  const repo = template.repo.trim()
  const current = loadCreateHistory()
  if (!owner || !repo) return current

  const templates = [
    { owner, repo },
    ...current.templates.filter(
      item => item.owner.toLowerCase() !== owner.toLowerCase() || item.repo.toLowerCase() !== repo.toLowerCase(),
    ),
  ].slice(0, MAX_ITEMS)

  const trimmedOrg = org?.trim() ?? ''
  const orgs = trimmedOrg
    ? [trimmedOrg, ...current.orgs.filter(item => item.toLowerCase() !== trimmedOrg.toLowerCase())].slice(0, MAX_ITEMS)
    : current.orgs

  const next = { templates, orgs }
  saveCreateHistory(next)
  return next
}

export function removeRecentTemplate(template: RecentTemplate): CreateHistory {
  const current = loadCreateHistory()
  const next = {
    ...current,
    templates: current.templates.filter(
      item => item.owner !== template.owner || item.repo !== template.repo,
    ),
  }
  saveCreateHistory(next)
  return next
}

export function removeRecentOrg(org: string): CreateHistory {
  const current = loadCreateHistory()
  const next = {
    ...current,
    orgs: current.orgs.filter(item => item !== org),
  }
  saveCreateHistory(next)
  return next
}

export function templateKey(template: RecentTemplate): string {
  return `${template.owner}/${template.repo}`
}
