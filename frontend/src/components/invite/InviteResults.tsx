import { Download } from 'lucide-react'
import type { InviteResponse, InviteStatus } from '../../types'
import { exportToCSV } from '../../utils/csv'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface Props {
  response: InviteResponse
}

const STATUS_VARIANT: Record<InviteStatus, 'success' | 'warning' | 'orange' | 'error'> = {
  invited: 'success',
  already_collaborator: 'warning',
  user_not_found: 'orange',
  failed: 'error',
}

const STATUS_LABELS: Record<InviteStatus, string> = {
  invited: 'Invited',
  already_collaborator: 'Already collaborator',
  user_not_found: 'User not found',
  failed: 'Failed',
}

export default function InviteResults({ response }: Props) {
  const { results, summary } = response

  const handleExport = () =>
    exportToCSV(
      results.map(r => ({ repository: r.repository, username: r.username, status: r.status, message: r.message ?? '' })),
      'invite-results.csv',
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4 text-sm font-medium flex-wrap">
          <span className="text-green-700">✓ {summary.invited} invited</span>
          <span className="text-yellow-700">⚠ {summary.already_collaborator} existing</span>
          <span className="text-orange-700">? {summary.user_not_found} not found</span>
          <span className="text-red-700">✗ {summary.failed} failed</span>
          <span className="text-slate-400">/ {summary.total} total</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleExport} className="gap-1.5 text-slate-500 h-8">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Repository</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Username</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-slate-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs">{r.repository}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{r.username}</td>
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
