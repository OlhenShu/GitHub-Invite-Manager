import { useMemo, useState } from 'react'
import { Copy, RefreshCw, Tag } from 'lucide-react'
import type { CopyIssuesResponse, IssuePreviewResponse } from '../../types'
import { copyIssues, previewIssues } from '../../api/client'
import { formatIssueNumberSpec, parseIssueNumberSpec } from '../../utils/issueNumbers'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import CopyIssueResults from './CopyIssueResults'
import RandomizeLabelsPanel from './RandomizeLabelsPanel'

interface Props {
  token: string
  suggestedRepos: string[]
}

type SelectionMode = 'all' | 'custom'

export default function CopyIssuesTab({ token, suggestedRepos }: Props) {
  const [sourceRepo, setSourceRepo] = useState('')
  const [targetRepo, setTargetRepo] = useState('')
  const [includeClosed, setIncludeClosed] = useState(true)
  const [preserveClosedState, setPreserveClosedState] = useState(true)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all')
  const [numberSpec, setNumberSpec] = useState('')
  const [preview, setPreview] = useState<IssuePreviewResponse | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<CopyIssuesResponse | null>(null)

  const parsedSpec = useMemo(() => parseIssueNumberSpec(numberSpec), [numberSpec])
  const previewNumbers = useMemo(() => new Set(preview?.issues.map(issue => issue.number) ?? []), [preview])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const missingFromPreview = useMemo(() => {
    if (!preview || selectionMode !== 'custom') return []
    return parsedSpec.numbers.filter(n => !previewNumbers.has(n))
  }, [preview, selectionMode, parsedSpec.numbers, previewNumbers])

  const applyCustomSpec = (spec: string, issues: { number: number }[] | null) => {
    const parsed = parseIssueNumberSpec(spec)
    if (issues) {
      const available = new Set(issues.map(issue => issue.number))
      setSelected(parsed.numbers.filter(n => available.has(n)))
    } else {
      setSelected(parsed.numbers)
    }
  }

  const handlePreview = async () => {
    if (!token.trim()) { setError('Please enter a GitHub token.'); return }
    if (!sourceRepo.trim() || !sourceRepo.includes('/')) {
      setError('Source repository must be in owner/repo format.')
      return
    }
    setLoadingPreview(true)
    setError(null)
    setResponse(null)
    try {
      const res = await previewIssues(token, sourceRepo.trim(), includeClosed)
      setPreview(res)
      if (selectionMode === 'all') {
        setSelected(res.issues.map(issue => issue.number))
      } else {
        applyCustomSpec(numberSpec, res.issues)
      }
    } catch (err) {
      setPreview(null)
      setSelected([])
      setError(err instanceof Error ? err.message : 'Could not load issues')
    } finally {
      setLoadingPreview(false)
    }
  }

  const setMode = (mode: SelectionMode) => {
    setSelectionMode(mode)
    if (mode === 'all') {
      if (preview) setSelected(preview.issues.map(issue => issue.number))
    } else {
      applyCustomSpec(numberSpec, preview?.issues ?? null)
    }
  }

  const handleSpecChange = (value: string) => {
    setNumberSpec(value)
    setSelectionMode('custom')
    applyCustomSpec(value, preview?.issues ?? null)
  }

  const toggleIssue = (number: number) => {
    const next = selected.includes(number)
      ? selected.filter(n => n !== number)
      : [...selected, number].sort((a, b) => a - b)
    setSelected(next)
    setSelectionMode('custom')
    setNumberSpec(formatIssueNumberSpec(next))
  }

  const selectAll = () => {
    setSelectionMode('all')
    if (preview) setSelected(preview.issues.map(issue => issue.number))
  }

  const clearSelection = () => {
    setSelectionMode('custom')
    setSelected([])
    setNumberSpec('')
  }

  const handleCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) { setError('Please enter a GitHub token.'); return }
    if (!sourceRepo.trim() || !targetRepo.trim()) {
      setError('Source and target repositories are required.')
      return
    }

    const issueNumbers = selectionMode === 'all'
      ? (preview ? preview.issues.map(issue => issue.number) : undefined)
      : (preview ? selected : parsedSpec.numbers)

    if ((issueNumbers?.length ?? 0) === 0 && selectionMode === 'custom') {
      setError('Enter issue numbers or a range, e.g. 1-5, 8, 12.')
      return
    }

    setCopying(true)
    setError(null)
    setResponse(null)
    try {
      const res = await copyIssues(token, {
        sourceRepo: sourceRepo.trim(),
        targetRepo: targetRepo.trim(),
        includeClosed,
        preserveClosedState,
        issueNumbers,
      })
      setResponse(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCopying(false)
    }
  }

  const copyCount = selectionMode === 'all'
    ? (preview?.issues.length ?? 0)
    : selected.length || parsedSpec.numbers.length
  const canCopy = selectionMode === 'all' || copyCount > 0

  return (
    <div className="space-y-8">
    <form onSubmit={handleCopy} className="space-y-6">
      <p className="text-sm text-slate-500">
        Copy issues from one repository to another. Missing labels are created on the target with the same name, color, and description. Pull requests are skipped.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="source-repo" className="text-sm font-medium">
            Source repository <span className="text-red-500">*</span>
          </Label>
          <Input
            id="source-repo"
            value={sourceRepo}
            onChange={e => setSourceRepo(e.target.value)}
            placeholder="owner/template-lab"
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-repo" className="text-sm font-medium">
            Target repository <span className="text-red-500">*</span>
          </Label>
          <Input
            id="target-repo"
            value={targetRepo}
            onChange={e => setTargetRepo(e.target.value)}
            placeholder="owner/student-lab"
            className="font-mono text-sm"
          />
        </div>
      </div>

      {suggestedRepos.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Repositories from this session</Label>
          <div className="flex flex-wrap gap-1.5">
            {suggestedRepos.map(repo => (
              <div key={repo} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSourceRepo(repo)}
                  className="font-mono text-xs px-2.5 py-1.5 rounded-md border bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                >
                  src: {repo}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRepo(repo)}
                  className="font-mono text-xs px-2.5 py-1.5 rounded-md border bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                >
                  dst: {repo}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Switch id="include-closed" checked={includeClosed} onCheckedChange={setIncludeClosed} />
          <Label htmlFor="include-closed" className="text-sm font-medium cursor-pointer">
            Include closed issues
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="preserve-closed" checked={preserveClosedState} onCheckedChange={setPreserveClosedState} />
          <Label htmlFor="preserve-closed" className="text-sm font-medium cursor-pointer">
            Keep closed issues closed on the target
          </Label>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-100">
        <Label className="text-sm font-medium">Which issues to copy</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('all')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              selectionMode === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            All issues
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              selectionMode === 'custom'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            Numbers / ranges
          </button>
        </div>

        {selectionMode === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="issue-spec" className="text-sm font-medium">
              Issue numbers
            </Label>
            <Input
              id="issue-spec"
              value={numberSpec}
              onChange={e => handleSpecChange(e.target.value)}
              placeholder="1-5, 8, 12-15"
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Examples: <code className="bg-slate-100 px-1 rounded">3</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">1-10</code>,{' '}
              <code className="bg-slate-100 px-1 rounded">1-5, 8, 12-15</code>
            </p>
            {parsedSpec.invalidTokens.length > 0 && (
              <p className="text-xs text-amber-700">
                Ignored tokens: {parsedSpec.invalidTokens.join(', ')}
              </p>
            )}
            {parsedSpec.numbers.length > 0 && (
              <p className="text-xs text-slate-500">
                {parsedSpec.numbers.length} number{parsedSpec.numbers.length !== 1 ? 's' : ''} parsed
                {preview && <> · {selected.length} found in preview</>}
              </p>
            )}
            {missingFromPreview.length > 0 && (
              <p className="text-xs text-amber-700">
                Not in the loaded preview: {missingFromPreview.join(', ')}
              </p>
            )}
          </div>
        )}

        {selectionMode === 'all' && (
          <p className="text-xs text-slate-500">
            Every issue from the source will be copied (except pull requests). Use Preview to review the list first.
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handlePreview}
        disabled={loadingPreview}
        className="gap-1.5"
      >
        <RefreshCw className={`w-4 h-4 ${loadingPreview ? 'animate-spin' : ''}`} />
        {loadingPreview ? 'Loading issues…' : 'Preview source issues'}
      </Button>

      {preview && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-slate-600">
              {preview.issues.length} issue{preview.issues.length !== 1 ? 's' : ''} in{' '}
              <span className="font-mono text-xs">{preview.repository}</span>
              {' · '}
              {selected.length} selected
            </p>
            <div className="flex gap-2">
              <button type="button" className="text-xs text-blue-600 hover:underline" onClick={selectAll}>
                Select all
              </button>
              <button type="button" className="text-xs text-blue-600 hover:underline" onClick={clearSelection}>
                Clear
              </button>
            </div>
          </div>

          {preview.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {preview.labels.map(label => (
                <span
                  key={label.name}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `#${label.color}22`,
                    borderColor: `#${label.color}`,
                    color: '#334155',
                  }}
                >
                  <Tag className="w-3 h-3" />
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {preview.issues.length === 0 ? (
            <p className="text-sm text-slate-500">No issues found (pull requests are excluded).</p>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-8" />
                    <th className="text-left px-3 py-2 font-medium text-slate-500 w-14">#</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-500">Title</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-500">Labels</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-500 w-20">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.issues.map(issue => (
                    <tr
                      key={issue.number}
                      className={selectedSet.has(issue.number) ? 'hover:bg-slate-50' : 'bg-slate-50/60 text-slate-400 hover:bg-slate-50'}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(issue.number)}
                          onChange={() => toggleIssue(issue.number)}
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{issue.number}</td>
                      <td className="px-3 py-2 text-xs">{issue.title}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{issue.labels.join(', ') || '–'}</td>
                      <td className="px-3 py-2 text-xs capitalize text-slate-500">{issue.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={copying || !canCopy}
        className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
      >
        {copying ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Copying {copyCount} issue{copyCount !== 1 ? 's' : ''}…
          </>
        ) : (
          <>
            <Copy className="w-5 h-5 mr-2" />
            {selectionMode === 'all' && !preview
              ? 'Copy all issues with labels'
              : `Copy ${copyCount} issue${copyCount === 1 ? '' : 's'} with labels`}
          </>
        )}
      </Button>

      {response && (
        <div className="pt-6 border-t border-slate-100">
          <CopyIssueResults response={response} />
        </div>
      )}
    </form>

    <RandomizeLabelsPanel
      token={token}
      sourceRepo={sourceRepo}
      targetRepo={targetRepo}
      suggestedRepos={suggestedRepos}
    />
    </div>
  )
}
