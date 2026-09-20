import { Download } from 'lucide-react'
import type { CreateReposResponse, RepoStatus } from '../../types'
import { exportToCSV } from '../../utils/csv'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface Props {
  response: CreateReposResponse
}

const STATUS_VARIANT: Record<RepoStatus, 'success' | 'warning' | 'error'> = {
  created: 'success',
  already_exists: 'warning',
  failed: 'error',
}

const STATUS_LABELS: Record<RepoStatus, string> = {
  created: 'Created',
  already_exists: 'Already exists',
  failed: 'Failed',
}

export default function RepoResults({ response }: Props) {
  const { results, summary } = response

  const handleExport = () =>
    exportToCSV(
      results.map(r => ({
        repo: r.fullName || r.repoName,
        status: r.status,
        url: r.url ?? '',
        message: r.message ?? '',
      })),
      'repo-results.csv',
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm font-medium">
          <span className="text-green-700">✓ {summary.created} created</span>
          <span className="text-yellow-700">⚠ {summary.already_exists} exists</span>
          <span className="text-red-700">✗ {summary.failed} failed</span>
          <span className="text-slate-400">/ {summary.total} total</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-slate-500 h-8">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Repository</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map(r => (
              <tr key={r.repoName} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {r.fullName || r.repoName}
                    </a>
                  ) : (r.fullName || r.repoName)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{r.message ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
