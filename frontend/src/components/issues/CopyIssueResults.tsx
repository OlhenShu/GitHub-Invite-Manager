import { Download } from 'lucide-react'
import type { CopyIssuesResponse, IssueCopyStatus } from '../../types'
import { exportToCSV } from '../../utils/csv'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface Props {
  response: CopyIssuesResponse
}

const ISSUE_VARIANT: Record<IssueCopyStatus, 'success' | 'warning' | 'error'> = {
  copied: 'success',
  skipped: 'warning',
  failed: 'error',
}

const ISSUE_LABELS: Record<IssueCopyStatus, string> = {
  copied: 'Copied',
  skipped: 'Skipped',
  failed: 'Failed',
}

export default function CopyIssueResults({ response }: Props) {
  const { results, labels, summary, labelSummary } = response

  const handleExport = () =>
    exportToCSV(
      results.map(r => ({
        source: String(r.sourceNumber),
        title: r.title,
        status: r.status,
        labels: r.labels.join('|'),
        url: r.url ?? '',
        message: r.message ?? '',
      })),
      'issue-copy-results.csv',
    )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4 text-sm font-medium flex-wrap">
          <span className="text-green-700">✓ {summary.copied} copied</span>
          <span className="text-yellow-700">⚠ {summary.skipped} skipped</span>
          <span className="text-red-700">✗ {summary.failed} failed</span>
          <span className="text-slate-400">/ {summary.total} issues</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-slate-500 h-8">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      {labels.length > 0 && (
        <p className="text-xs text-slate-500">
          Labels: {labelSummary.created} created, {labelSummary.already_exists} already on target
          {labelSummary.failed > 0 && `, ${labelSummary.failed} failed`}
        </p>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-16">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Title</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Labels</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map(r => (
              <tr key={r.sourceNumber} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{r.sourceNumber}</td>
                <td className="px-4 py-2.5 text-xs">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {r.title}
                    </a>
                  ) : r.title}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{r.labels.join(', ') || '–'}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={ISSUE_VARIANT[r.status]}>{ISSUE_LABELS[r.status]}</Badge>
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
