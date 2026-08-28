import { useState } from 'react'
import { X } from 'lucide-react'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface Props {
  usernames: string[]
  teams: string[]
  assignments: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

function repoLabel(full: string) {
  const i = full.lastIndexOf('/')
  return i >= 0 ? full.slice(i + 1) : full
}

export default function TeamAssignmentBoard({ usernames, teams, assignments, onChange }: Props) {
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)

  const unassigned = usernames.filter(u => !assignments[u])
  const membersByTeam = teams.map(team => ({
    team,
    members: usernames.filter(u => assignments[u] === team),
  }))

  const assign = (username: string, team: string) => {
    onChange({ ...assignments, [username]: team })
    setSelectedUsername(null)
  }

  const unassign = (username: string) => {
    const next = { ...assignments }
    delete next[username]
    onChange(next)
    if (selectedUsername === username) setSelectedUsername(null)
  }

  const toggleSelect = (username: string) =>
    setSelectedUsername(prev => (prev === username ? null : username))

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">Assign to teams</Label>
        <p className="text-xs text-slate-500 mt-1">
          Click a username, then click a team – or pick a team from the dropdown. Each person can be in one team.
        </p>
      </div>

      {teams.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-lg">
          Add team repositories first (select from this session or type them under Additional repositories).
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500">
          Unassigned ({unassigned.length})
        </p>
        {unassigned.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-1">
            {usernames.length === 0 ? 'No usernames entered.' : 'Everyone is assigned.'}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {unassigned.map(username => (
              <div
                key={username}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all ${
                  selectedUsername === username
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(username)}
                  className="font-mono text-xs text-slate-800 px-1.5 py-1 rounded-md hover:bg-slate-100 flex-1 text-left"
                >
                  {username}
                </button>
                <Select
                  disabled={teams.length === 0}
                  onValueChange={team => assign(username, team)}
                >
                  <SelectTrigger className="h-8 w-52 text-xs">
                    <SelectValue placeholder="Choose team…" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team} value={team}>
                        {repoLabel(team)} ({team})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      {teams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {membersByTeam.map(({ team, members }) => (
            <div
              key={team}
              role={selectedUsername ? 'button' : undefined}
              tabIndex={selectedUsername ? 0 : undefined}
              onClick={() => selectedUsername && assign(selectedUsername, team)}
              onKeyDown={e => {
                if (selectedUsername && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  assign(selectedUsername, team)
                }
              }}
              className={`text-left border rounded-lg overflow-hidden transition-all ${
                selectedUsername
                  ? 'border-blue-400 hover:border-blue-600 hover:bg-blue-50 cursor-pointer'
                  : 'border-slate-200'
              }`}
            >
              <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-medium text-slate-800 truncate">{repoLabel(team)}</p>
                  <p className="font-mono text-[10px] text-slate-400 truncate">{team}</p>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{members.length}</span>
              </div>
              <div className="p-2 min-h-[3rem] space-y-1">
                {members.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic px-1">
                    {selectedUsername ? `Click to add ${selectedUsername}` : 'No members yet'}
                  </p>
                ) : (
                  members.map(username => (
                    <div
                      key={username}
                      className="flex items-center justify-between gap-1 font-mono text-xs bg-white border border-slate-200 rounded-md px-2 py-1"
                    >
                      <span className="truncate">{username}</span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          unassign(username)
                        }}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded"
                        aria-label={`Remove ${username}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
