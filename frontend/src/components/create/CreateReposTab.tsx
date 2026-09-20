import { useState, useMemo, useEffect } from 'react'
import { GitBranch, FileText, Shield, Hash, Lock } from 'lucide-react'
import type { AuthenticatedUser, CreateReposRequest, CreateReposResponse, NamingMode } from '../../types'
import { createRepos, getAuthenticatedUser } from '../../api/client'
import { buildRepoNamesFromUsernames, parseUsernames } from '../../utils/nameGenerator'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import NamingPatternForm from './NamingPatternForm'
import NamingListForm from './NamingListForm'
import RepoResults from './RepoResults'

interface Props {
  token: string
  onReposCreated: (repos: string[], usernames?: string[]) => void
}

export default function CreateReposTab({ token, onReposCreated }: Props) {
  const [namingMode, setNamingMode] = useState<NamingMode>('PATTERN')
  const [templateOwner, setTemplateOwner] = useState('')
  const [templateRepo, setTemplateRepo] = useState('')
  const [targetOrg, setTargetOrg] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public' | 'internal'>('private')
  const [includeAllBranches, setIncludeAllBranches] = useState(false)
  const [description, setDescription] = useState('')
  const [pattern, setPattern] = useState({ baseName: '', count: 5, startIndex: 1, padding: 2 })
  const [listRaw, setListRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CreateReposResponse | null>(null)
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null)

  const hasOrg = targetOrg.trim().length > 0

  useEffect(() => {
    if (!token.trim()) {
      setAuthUser(null)
      return
    }
    let cancelled = false
    const handle = window.setTimeout(() => {
      getAuthenticatedUser(token)
        .then(user => {
          if (!cancelled) setAuthUser(user)
        })
        .catch(() => {
          if (!cancelled) setAuthUser(null)
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [token])

  useEffect(() => {
    if (!hasOrg && visibility === 'internal') {
      setVisibility('private')
    }
  }, [hasOrg, visibility])

  const listUsernames = useMemo(() => parseUsernames(listRaw), [listRaw])
  const listRepoNames = useMemo(
    () => buildRepoNamesFromUsernames(templateRepo, listUsernames),
    [templateRepo, listUsernames],
  )

  const repoCount = useMemo(() => {
    if (namingMode === 'PATTERN') return pattern.baseName.trim() ? pattern.count : 0
    return listRepoNames.length
  }, [namingMode, pattern, listRepoNames])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) { setError('Please enter a GitHub token.'); return }
    if (!templateOwner.trim() || !templateRepo.trim()) {
      setError('Template owner and template repository are required.')
      return
    }
    if (repoCount === 0) { setError('No repository names to create.'); return }

    const req: CreateReposRequest = {
      templateOwner: templateOwner.trim(),
      templateRepo: templateRepo.trim(),
      targetOrg: targetOrg.trim() || undefined,
      namingMode,
      visibility,
      includeAllBranches,
      description: description.trim() || undefined,
      ...(namingMode === 'PATTERN'
        ? { baseName: pattern.baseName.trim(), count: pattern.count, startIndex: pattern.startIndex, padding: pattern.padding }
        : { repoNames: listRepoNames }),
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await createRepos(token, req)
      setResponse(res)
      onReposCreated(
        res.results
          .filter(r => r.status === 'created' || r.status === 'already_exists')
          .map(r => r.fullName || (targetOrg.trim() ? `${targetOrg.trim()}/${r.repoName}` : r.repoName))
          .filter(name => name.includes('/')),
        namingMode === 'LIST' ? listUsernames : undefined,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-6">

        {/* Template Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Template Configuration</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-owner" className="text-sm font-medium">
              Template owner <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-owner"
              value={templateOwner}
              onChange={e => setTemplateOwner(e.target.value)}
              placeholder="my-org"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-repo" className="text-sm font-medium">
              Template repository <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template-repo"
              value={templateRepo}
              onChange={e => setTemplateRepo(e.target.value)}
              placeholder="lab-template"
            />
          </div>
        </div>

        {/* Repository Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Repository Settings</h3>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-org" className="text-sm font-medium">
              Target organization{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="target-org"
              value={targetOrg}
              onChange={e => setTargetOrg(e.target.value)}
              placeholder="my-org"
            />
            <p className="text-xs text-slate-500">
              {hasOrg
                ? 'Repositories will be created in this organization.'
                : authUser
                  ? <>Leave empty to create under your account <span className="font-mono text-slate-700">@{authUser.login}</span>.</>
                  : 'Leave empty to create repositories under your GitHub account.'}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visibility</Label>
            <Select value={visibility} onValueChange={v => setVisibility(v as typeof visibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Private
                  </div>
                </SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal" disabled={!hasOrg}>
                  Internal (org plan)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description – full width */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description{' '}
            <span className="text-slate-400 font-normal">
              (optional – use <code className="bg-slate-100 px-1 rounded text-xs">{'{name}'}</code> for repo name substitution)
            </span>
          </Label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Student lab: {name}"
          />
        </div>

        {/* Include all branches – full width */}
        <div className="col-span-2 flex items-center space-x-2">
          <Switch
            id="include-branches"
            checked={includeAllBranches}
            onCheckedChange={setIncludeAllBranches}
          />
          <Label htmlFor="include-branches" className="text-sm font-medium cursor-pointer">
            Include all branches from template
          </Label>
        </div>

        {/* Naming Mode – full width */}
        <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Naming Mode</h3>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={namingMode === 'PATTERN' ? 'default' : 'outline'}
              onClick={() => setNamingMode('PATTERN')}
              className={namingMode === 'PATTERN' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : ''}
            >
              Pattern + Counter
            </Button>
            <Button
              type="button"
              variant={namingMode === 'LIST' ? 'default' : 'outline'}
              onClick={() => setNamingMode('LIST')}
              className={namingMode === 'LIST' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : ''}
            >
              Custom List
            </Button>
          </div>

          {namingMode === 'PATTERN' ? (
            <NamingPatternForm value={pattern} onChange={v => setPattern(p => ({ ...p, ...v }))} />
          ) : (
            <NamingListForm value={listRaw} templateRepo={templateRepo} onChange={setListRaw} />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="col-span-2 pt-4">
          <Button
            type="submit"
            disabled={loading || repoCount === 0}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating {repoCount} repositories…
              </>
            ) : (
              <>
                <GitBranch className="w-5 h-5 mr-2" />
                Create {repoCount || 0} repositor{repoCount === 1 ? 'y' : 'ies'}
              </>
            )}
          </Button>
        </div>
      </div>

      {response && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <RepoResults response={response} />
        </div>
      )}
    </form>
  )
}
