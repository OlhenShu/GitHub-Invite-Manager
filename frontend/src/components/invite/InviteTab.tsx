import { useState, useRef, useMemo, useEffect } from 'react'
import { Upload, Send, Users, User, HelpCircle } from 'lucide-react'
import type { InviteMode, InviteResponse } from '../../types'
import { sendInvites } from '../../api/client'
import { parseUsernames } from '../../utils/nameGenerator'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { TooltipRoot, TooltipTrigger, TooltipContent } from '../ui/tooltip'
import InviteResults from './InviteResults'
import TeamAssignmentBoard from './TeamAssignmentBoard'
import ExistingRepoPicker from './ExistingRepoPicker'

interface Props {
  token: string
  suggestedRepos: string[]
  initialUsernames?: string[]
}

const PERMISSIONS = ['push', 'pull', 'triage', 'maintain', 'admin'] as const

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  push: 'Can read, clone, and push to the repository',
  pull: 'Can read and clone the repository only',
  triage: 'Can manage issues and pull requests without write access',
  maintain: 'Can manage the repo without access to sensitive or destructive actions',
  admin: 'Full access including settings, secrets, and team management',
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-slate-400 hover:text-slate-600 transition-colors ml-1 align-middle">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </TooltipRoot>
  )
}

export default function InviteTab({ token, suggestedRepos, initialUsernames = [] }: Props) {
  const [mode, setMode] = useState<InviteMode>('INDIVIDUAL')
  const [rawUsernames, setRawUsernames] = useState('')
  const [selectedSuggested, setSelectedSuggested] = useState<string[]>([])
  const [manualRepos, setManualRepos] = useState('')
  const [permission, setPermission] = useState('push')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<InviteResponse | null>(null)
  const [teamAssignments, setTeamAssignments] = useState<Record<string, string>>({})
  const [githubSelected, setGithubSelected] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialUsernames.length > 0) {
      setRawUsernames(initialUsernames.join('\n'))
    }
  }, [initialUsernames])

  useEffect(() => {
    if (suggestedRepos.length > 0 && mode === 'INDIVIDUAL') {
      setSelectedSuggested(suggestedRepos)
    }
  }, [suggestedRepos, mode])

  const parsedUsernames = useMemo(() => parseUsernames(rawUsernames), [rawUsernames])

  const allRepos = useMemo(() => {
    const fromSuggested = suggestedRepos.filter(r => selectedSuggested.includes(r))
    const fromGithub = githubSelected.filter(r => !fromSuggested.includes(r))
    const manual = manualRepos.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
    const seen = new Set<string>()
    const result: string[] = []
    for (const repo of [...fromSuggested, ...fromGithub, ...manual]) {
      if (!seen.has(repo)) {
        seen.add(repo)
        result.push(repo)
      }
    }
    return result
  }, [suggestedRepos, selectedSuggested, githubSelected, manualRepos])

  useEffect(() => {
    setTeamAssignments(prev => {
      const next: Record<string, string> = {}
      for (const [user, repo] of Object.entries(prev)) {
        if (parsedUsernames.includes(user) && allRepos.includes(repo)) next[user] = repo
      }
      const same =
        Object.keys(next).length === Object.keys(prev).length &&
        Object.keys(next).every(k => next[k] === prev[k])
      return same ? prev : next
    })
  }, [parsedUsernames, allRepos])

  const pairs = useMemo(() => {
    const len = Math.max(allRepos.length, parsedUsernames.length)
    return Array.from({ length: len }, (_, i) => ({
      index: i + 1,
      repo: allRepos[i] ?? null,
      username: parsedUsernames[i] ?? null,
    }))
  }, [allRepos, parsedUsernames])

  const teamAssignmentCount = Object.keys(teamAssignments).length
  const matchedCount = mode === 'INDIVIDUAL'
    ? Math.min(allRepos.length, parsedUsernames.length)
    : teamAssignmentCount

  const unmatchedRepos = allRepos.length - Math.min(allRepos.length, parsedUsernames.length)
  const unmatchedUsers = parsedUsernames.length - Math.min(allRepos.length, parsedUsernames.length)

  const toggleSuggested = (repo: string) =>
    setSelectedSuggested(prev =>
      prev.includes(repo) ? prev.filter(r => r !== repo) : [...prev, repo],
    )

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setRawUsernames(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) { setError('Please enter a GitHub token.'); return }
    if (parsedUsernames.length === 0) { setError('No valid usernames found.'); return }
    if (allRepos.length === 0) { setError('Please specify at least one repository.'); return }
    if (mode === 'TEAM' && teamAssignmentCount === 0) { setError('Assign at least one username to a team.'); return }
    if (matchedCount === 0) { setError('No pairs to send.'); return }

    const assignments = Object.entries(teamAssignments).map(([username, repository]) => ({ username, repository }))

    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await sendInvites(token, {
        rawUsernames,
        repositories: allRepos,
        permission,
        mode,
        ...(mode === 'TEAM' ? { assignments } : {}),
      })
      setResponse(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">

        {/* Mode toggle */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium">Invite mode</Label>
            <FieldHint>
              <p className="font-medium mb-1">Individual – 1-to-1</p>
              <p className="text-slate-500">repos[0] → users[0], repos[1] → users[1]…</p>
              <p className="font-medium mt-2 mb-1">Team – manual assignment</p>
              <p className="text-slate-500">Click a username and choose which team repository to add them to. Several people can share one team.</p>
            </FieldHint>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('INDIVIDUAL')
                if (suggestedRepos.length > 0) setSelectedSuggested(suggestedRepos)
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                mode === 'INDIVIDUAL'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              <User className="w-4 h-4" />
              Individual
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('TEAM')
                setSelectedSuggested([])
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                mode === 'TEAM'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Team
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {mode === 'INDIVIDUAL'
              ? 'repos[i] → usernames[i] – each person gets their own repo (1-to-1 pairing)'
              : 'Click a username and choose which team repository to add them to'}
          </p>
        </div>

        {/* Usernames */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-medium">
                GitHub usernames <span className="text-red-500">*</span>
              </Label>
              <FieldHint>
                <p className="font-medium mb-1">One GitHub username per line.</p>
                <p className="text-slate-500 mb-1">Lines starting with <code className="bg-slate-100 px-1 rounded">#</code> are treated as comments and ignored.</p>
                {mode === 'INDIVIDUAL'
                  ? <p className="text-slate-500">Order matters – user on line N is paired with repo N.</p>
                  : <p className="text-slate-500">Order doesn't matter – you will assign each person to a team below.</p>}
                <p className="text-slate-400 mt-1 text-[11px]">Example:<br />alice<br />bob<br /># spare account<br />charlie</p>
              </FieldHint>
              <span className="text-slate-400 text-xs font-normal ml-1">
                {mode === 'INDIVIDUAL' ? '(one per line, in order)' : '(one per line)'}
              </span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5 text-slate-500 h-8">
              <Upload className="w-3.5 h-3.5" />
              Upload .txt
            </Button>
            <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
          </div>
          <Textarea
            value={rawUsernames}
            onChange={e => setRawUsernames(e.target.value)}
            rows={5}
            placeholder={mode === 'INDIVIDUAL'
              ? '# position 1 → team-1\nalice\n# position 2 → team-2\nbob'
              : '# whole team\nalice\nbob\ncharlie'}
            className="font-mono text-sm"
          />
          {parsedUsernames.length > 0 && (
            <p className="text-xs text-slate-500">
              {parsedUsernames.length} unique username{parsedUsernames.length !== 1 ? 's' : ''} parsed.
            </p>
          )}
        </div>

        {/* Suggested repos from session */}
        {suggestedRepos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-medium">
                {mode === 'TEAM' ? 'Team repositories from this session' : 'Repositories from this session'}
              </Label>
              <FieldHint>
                {mode === 'INDIVIDUAL'
                  ? <>
                      <p className="font-medium mb-1">Click repos to select them in order.</p>
                      <p className="text-slate-500">The number shown on each chip is the position in the pairing queue – it must match the line number of the corresponding username.</p>
                    </>
                  : <>
                      <p className="font-medium mb-1">Click the team repos you want to assign people to.</p>
                      <p className="text-slate-500">These become the teams in the assignment board below. Student repos from Custom List are not selected automatically.</p>
                    </>}
              </FieldHint>
              <span className="text-slate-400 text-xs font-normal ml-1">
                {mode === 'INDIVIDUAL' ? '(click to select in order)' : '(click to select teams)'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-3 border border-slate-200 rounded-lg bg-slate-50">
              {suggestedRepos.map(repo => {
                const pos = selectedSuggested.indexOf(repo)
                const selected = pos !== -1
                return (
                  <button
                    key={repo}
                    type="button"
                    onClick={() => toggleSuggested(repo)}
                    className={`font-mono text-xs px-2.5 py-1.5 rounded-md border transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {selected && mode === 'INDIVIDUAL' && <span className="font-bold text-blue-100">#{pos + 1}</span>}
                    {repo}
                  </button>
                )
              })}
            </div>
            {selectedSuggested.length > 0 && (
              <p className="text-xs text-slate-500">
                {selectedSuggested.length} selected.{' '}
                <button type="button" className="text-blue-600 hover:underline" onClick={() => setSelectedSuggested([])}>
                  Clear
                </button>
              </p>
            )}
          </div>
        )}

        {/* Existing repos from GitHub */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium">Existing repositories</Label>
            <FieldHint>
              <p className="font-medium mb-1">Invite to a repository you already have.</p>
              <p className="text-slate-500 mb-1"><strong>My account</strong> — personal repos with no organization, e.g. <code className="bg-slate-100 px-1 rounded">yourname/lab-01</code>.</p>
              <p className="text-slate-500"><strong>Organization</strong> — repos inside an org, e.g. <code className="bg-slate-100 px-1 rounded">my-org/lab-01</code>.</p>
            </FieldHint>
            <span className="text-slate-400 text-xs font-normal ml-1">
              (personal account or organization)
            </span>
          </div>
          <ExistingRepoPicker token={token} selected={githubSelected} onChange={setGithubSelected} />
        </div>

        {/* Manual repos */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label className="text-sm font-medium">Additional repositories</Label>
            <FieldHint>
              <p className="font-medium mb-1">One repository per line in <code className="bg-slate-100 px-1 rounded">owner/repo</code> format.</p>
              <p className="text-slate-500 mb-1">Works with a personal account or an organization. Lines starting with <code className="bg-slate-100 px-1 rounded">#</code> are ignored.</p>
              {mode === 'INDIVIDUAL' && <p className="text-slate-500">Order matters – repo on line N is paired with username N.</p>}
              <p className="text-slate-400 mt-1 text-[11px]">Example:<br />yourname/lab-01<br />my-org/lab-02</p>
            </FieldHint>
            <span className="text-slate-400 text-xs font-normal ml-1">
              (owner/repo — personal or org{mode === 'INDIVIDUAL' ? ', in order' : ''})
            </span>
          </div>
          <Textarea
            value={manualRepos}
            onChange={e => setManualRepos(e.target.value)}
            rows={3}
            placeholder={'yourname/lab-01\nmy-org/lab-02'}
            className="font-mono text-sm"
          />
        </div>

        {/* Preview */}
        {mode === 'INDIVIDUAL' ? (
          pairs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label className="text-sm font-medium">Pairing preview</Label>
                <FieldHint>
                  <p className="font-medium mb-1">repos[i] → username[i]</p>
                  <p className="text-slate-500">Each row shows which username will receive an invite to which repo. Rows marked <span className="text-amber-600">skip</span> won't be sent – fix the list lengths to remove the warning.</p>
                </FieldHint>
                <span className="text-slate-400 text-xs font-normal ml-1">– repo[i] → username[i]</span>
              </div>

              {(unmatchedRepos > 0 || unmatchedUsers > 0) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-lg">
                  {unmatchedRepos > 0 && <span>⚠ {unmatchedRepos} repo{unmatchedRepos !== 1 ? 's' : ''} without a username. </span>}
                  {unmatchedUsers > 0 && <span>⚠ {unmatchedUsers} username{unmatchedUsers !== 1 ? 's' : ''} without a repository. </span>}
                  Only {matchedCount} pair{matchedCount !== 1 ? 's' : ''} will be invited.
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-500 w-8">#</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Repository</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500">Username</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-500 w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pairs.map(pair => (
                      <tr key={pair.index} className={pair.repo && pair.username ? 'hover:bg-slate-50' : 'bg-amber-50'}>
                        <td className="px-4 py-2 text-slate-400">{pair.index}</td>
                        <td className="px-4 py-2 font-mono">{pair.repo ?? <span className="text-amber-500 italic">–</span>}</td>
                        <td className="px-4 py-2 font-mono">{pair.username ?? <span className="text-amber-500 italic">–</span>}</td>
                        <td className="px-4 py-2">
                          {pair.repo && pair.username
                            ? <span className="text-green-600 font-medium">✓</span>
                            : <span className="text-amber-500">skip</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <TeamAssignmentBoard
            usernames={parsedUsernames}
            teams={allRepos}
            assignments={teamAssignments}
            onChange={setTeamAssignments}
          />
        )}

        {/* Permission */}
        <div className="flex items-end gap-6">
          <div className="space-y-2 w-48">
            <div className="flex items-center gap-1">
              <Label className="text-sm font-medium">Permission level</Label>
              <FieldHint>
                <p className="font-medium mb-2">Access level granted to the invited user:</p>
                {Object.entries(PERMISSION_DESCRIPTIONS).map(([key, desc]) => (
                  <p key={key} className="mb-1">
                    <span className="font-medium text-slate-700">{key}</span>
                    <span className="text-slate-500"> – {desc}</span>
                  </p>
                ))}
                <p className="text-slate-500 mt-2">Personal (non-org) repos accept pull, push, and admin. Org-only roles are retried without a permission field.</p>
              </FieldHint>
            </div>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERMISSIONS.map(p => (
                  <SelectItem key={p} value={p}>
                    <span>{p}</span>
                    <span className="ml-2 text-slate-400 text-xs hidden sm:inline">{PERMISSION_DESCRIPTIONS[p]}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400 leading-snug w-72">
              Personal repos typically get write access. Organization-only roles (triage, maintain) are retried without a permission field.
            </p>
          </div>
          {matchedCount > 0 && mode === 'INDIVIDUAL' && (
            <p className="text-sm text-slate-500 mb-2">
              {allRepos.length} repo{allRepos.length !== 1 ? 's' : ''} × 1 user each ={' '}
              <strong>{matchedCount}</strong> invitation{matchedCount !== 1 ? 's' : ''}
            </p>
          )}
          {mode === 'TEAM' && parsedUsernames.length > 0 && (
            <p className="text-sm text-slate-500 mb-2">
              <strong>{teamAssignmentCount}</strong> assigned
              {parsedUsernames.length - teamAssignmentCount > 0 && (
                <span> · {parsedUsernames.length - teamAssignmentCount} unassigned (skipped)</span>
              )}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || matchedCount === 0}
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending {matchedCount} invitation{matchedCount !== 1 ? 's' : ''}…
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              {mode === 'INDIVIDUAL'
                ? `Send ${matchedCount} invitation${matchedCount !== 1 ? 's' : ''} (1 per repo)`
                : `Send ${matchedCount} invitation${matchedCount !== 1 ? 's' : ''} (manual team assignment)`}
            </>
          )}
        </Button>

        {/* Results */}
        {response && (
          <div className="pt-6 border-t border-slate-100">
            <InviteResults response={response} />
          </div>
        )}
      </div>
    </form>
  )
}