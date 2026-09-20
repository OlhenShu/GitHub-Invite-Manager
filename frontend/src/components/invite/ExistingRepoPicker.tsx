import { useMemo, useState, type KeyboardEvent } from 'react'
import { Building2, RefreshCw, Search, User } from 'lucide-react'
import type { ExistingRepo } from '../../types'
import { listRepos } from '../../api/client'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export type RepoOwnerKind = 'personal' | 'organization'

interface Props {
  token: string
  selected: string[]
  onChange: (fullNames: string[]) => void
}

export default function ExistingRepoPicker({ token, selected, onChange }: Props) {
  const [ownerKind, setOwnerKind] = useState<RepoOwnerKind>('personal')
  const [orgFilter, setOrgFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loaded, setLoaded] = useState<ExistingRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return loaded
    return loaded.filter(repo =>
      repo.fullName.toLowerCase().includes(q) || repo.owner.toLowerCase().includes(q),
    )
  }, [loaded, search])

  const handleLoad = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token.')
      return
    }
    if (ownerKind === 'organization' && !orgFilter.trim()) {
      setError('Enter an organization name, or switch to My account.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const repos = await listRepos(token, ownerKind === 'organization' ? orgFilter : undefined)
      setLoaded(repos)
      setHasLoaded(true)
      const available = new Set(repos.map(r => r.fullName))
      onChange(selected.filter(name => available.has(name)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load repositories')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (fullName: string) => {
    onChange(
      selected.includes(fullName)
        ? selected.filter(name => name !== fullName)
        : [...selected, fullName],
    )
  }

  const onFilterKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handleLoad()
    }
  }

  const switchKind = (kind: RepoOwnerKind) => {
    setOwnerKind(kind)
    setHasLoaded(false)
    setLoaded([])
    setError(null)
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchKind('personal')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            ownerKind === 'personal'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}
        >
          <User className="w-4 h-4" />
          My account
        </button>
        <button
          type="button"
          onClick={() => switchKind('organization')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
            ownerKind === 'organization'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organization
        </button>
      </div>
      <p className="text-xs text-slate-500">
        {ownerKind === 'personal'
          ? 'Loads repositories you own on your personal GitHub account (no organization). Token resource owner must be your user.'
          : 'Loads repositories in an organization. Token resource owner must be that organization.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        {ownerKind === 'organization' && (
          <div className="flex-1 space-y-2">
            <Label htmlFor="org-filter" className="text-sm font-medium">
              Organization <span className="text-red-500">*</span>
            </Label>
            <Input
              id="org-filter"
              value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              onKeyDown={onFilterKeyDown}
              placeholder="my-org"
            />
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleLoad}
          disabled={loading}
          className="h-10 gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading…' : hasLoaded ? 'Reload from GitHub' : 'Load from GitHub'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {hasLoaded && (
        <>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              placeholder="Search loaded repositories…"
              className="pl-9"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500">
              {loaded.length === 0
                ? ownerKind === 'personal'
                  ? 'No personal repositories found. Use a fine-grained token whose resource owner is your user account.'
                  : 'No organization repositories found. Check the org name and that the token belongs to that org.'
                : 'No repositories match the search.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
              {filtered.map(repo => {
                const isSelected = selected.includes(repo.fullName)
                const isOrg = repo.ownerType?.toLowerCase() === 'organization'
                return (
                  <button
                    key={repo.fullName}
                    type="button"
                    onClick={() => toggle(repo.fullName)}
                    title={isOrg ? 'Organization repository' : 'Personal repository'}
                    className={`font-mono text-xs px-2.5 py-1.5 rounded-md border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {repo.fullName}
                  </button>
                )
              })}
            </div>
          )}
          <p className="text-xs text-slate-500">
            {loaded.length} loaded
            {selected.length > 0 && <> · {selected.length} selected</>}
            {selected.length > 0 && (
              <>
                {' '}
                <button type="button" className="text-blue-600 hover:underline" onClick={() => onChange([])}>
                  Clear
                </button>
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
