import { useEffect, useMemo, useState } from 'react'
import { Palette, Tag } from 'lucide-react'
import type { LabelColorResult, RandomizeLabelsResponse } from '../../types'
import { randomizeLabelColors } from '../../api/client'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface Props {
  token: string
  sourceRepo: string
  targetRepo: string
  suggestedRepos: string[]
}

export default function RandomizeLabelsPanel({ token, sourceRepo, targetRepo, suggestedRepos }: Props) {
  const [repository, setRepository] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<RandomizeLabelsResponse | null>(null)

  useEffect(() => {
    if (repository.trim()) return
    const fallback = sourceRepo.trim() || targetRepo.trim()
    if (fallback.includes('/')) setRepository(fallback)
  }, [sourceRepo, targetRepo, repository])

  const chips = useMemo(() => {
    const seen = new Set<string>()
    const items: string[] = []
    for (const repo of [sourceRepo, targetRepo, ...suggestedRepos]) {
      const name = repo.trim()
      if (!name.includes('/') || seen.has(name)) continue
      seen.add(name)
      items.push(name)
    }
    return items
  }, [sourceRepo, targetRepo, suggestedRepos])

  const handleRandomize = async () => {
    if (!token.trim()) { setError('Please enter a GitHub token.'); return }
    if (!repository.trim() || !repository.includes('/')) {
      setError('Repository must be in owner/repo format.')
      return
    }
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await randomizeLabelColors(token, repository.trim())
      setResponse(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not randomize label colors')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Palette className="w-4 h-4 text-amber-700" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">Randomize label colors</h3>
          <p className="text-sm text-slate-500 mt-1">
            Assigns a new random color to every label on the selected repository. Issue assignments stay the same — only colors change on GitHub.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="recolor-repo" className="text-sm font-medium">
            Repository <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recolor-repo"
            value={repository}
            onChange={e => setRepository(e.target.value)}
            placeholder="owner/lab-template"
            className="font-mono text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={handleRandomize}
          disabled={loading}
          className="h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Recoloring…
            </>
          ) : (
            <>
              <Palette className="w-4 h-4 mr-2" />
              Randomize colors
            </>
          )}
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(repo => (
            <button
              key={repo}
              type="button"
              onClick={() => setRepository(repo)}
              className={`font-mono text-xs px-2.5 py-1.5 rounded-md border ${
                repository === repo
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
              }`}
            >
              {repo}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {response && <RecolorResults response={response} />}
    </section>
  )
}

function RecolorResults({ response }: { response: RandomizeLabelsResponse }) {
  const { results, summary } = response
  if (results.length === 0) {
    return <p className="text-sm text-slate-500">No labels found on {response.repository}.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        {summary.updated} updated
        {summary.failed > 0 && <>, {summary.failed} failed</>}
        {' · '}
        <span className="font-mono text-xs">{response.repository}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {results.map(result => (
          <ColorChip key={result.name} result={result} />
        ))}
      </div>
    </div>
  )
}

function ColorChip({ result }: { result: LabelColorResult }) {
  const failed = result.status === 'failed'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border"
      title={result.message ?? `${result.previousColor ?? ''} → ${result.color}`}
      style={
        failed
          ? undefined
          : {
              backgroundColor: `#${result.color}22`,
              borderColor: `#${result.color}`,
              color: '#334155',
            }
      }
    >
      <Tag className="w-3 h-3" />
      {result.name}
      {!failed && result.previousColor && (
        <span className="font-mono text-[10px] text-slate-400">
          #{result.previousColor} → #{result.color}
        </span>
      )}
      {failed && <span className="text-red-600">failed</span>}
    </span>
  )
}
