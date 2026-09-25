import { useMemo, useState, type ReactNode } from 'react'
import { History, Search, X } from 'lucide-react'
import { templateKey, type RecentTemplate } from '../../utils/createHistory'
import { Input } from '../ui/input'

const LIST_HEIGHT = 'h-44'

function matchesTokens(fields: string[], query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.every(token => fields.some(field => field.toLowerCase().includes(token)))
}

export function RecentTemplatePicker({
  items,
  activeOwner,
  activeRepo,
  onSelect,
  onRemove,
}: {
  items: RecentTemplate[]
  activeOwner: string
  activeRepo: string
  onSelect: (item: RecentTemplate) => void
  onRemove: (item: RecentTemplate) => void
}) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalized) return items
    return items.filter(item => matchesTokens([item.owner, item.repo, templateKey(item)], normalized))
  }, [items, normalized])

  const groups = useMemo(() => {
    const byOwner = new Map<string, RecentTemplate[]>()
    for (const item of filtered) {
      const list = byOwner.get(item.owner) ?? []
      list.push(item)
      byOwner.set(item.owner, list)
    }
    return [...byOwner.entries()]
  }, [filtered])

  if (items.length === 0) return null

  return (
    <RecentPanel
      label="Recent templates"
      count={items.length}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Filter by owner or template"
    >
      {filtered.length === 0 ? (
        <EmptyFilter query={query} />
      ) : (
        groups.map(([owner, templates]) => (
          <div key={owner}>
            <p className="sticky top-0 z-10 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
              {owner}
              <span className="ml-1 font-normal text-slate-400">{templates.length}</span>
            </p>
            {templates.map(item => {
              const active = activeOwner === item.owner && activeRepo === item.repo
              return (
                <HistoryRow
                  key={templateKey(item)}
                  label={item.repo}
                  active={active}
                  onSelect={() => onSelect(item)}
                  onRemove={() => onRemove(item)}
                  removeLabel={`Remove ${templateKey(item)} from history`}
                />
              )
            })}
          </div>
        ))
      )}
    </RecentPanel>
  )
}

export function RecentOrgPicker({
  items,
  active,
  onSelect,
  onRemove,
}: {
  items: string[]
  active: string
  onSelect: (org: string) => void
  onRemove: (org: string) => void
}) {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const filtered = useMemo(
    () => (normalized ? items.filter(org => matchesTokens([org], normalized)) : items),
    [items, normalized],
  )

  if (items.length === 0) return null

  return (
    <RecentPanel
      label="Recent organizations"
      count={items.length}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Filter organizations"
    >
      {filtered.length === 0 ? (
        <EmptyFilter query={query} />
      ) : (
        filtered.map(org => (
          <HistoryRow
            key={org}
            label={org}
            active={active === org}
            onSelect={() => onSelect(org)}
            onRemove={() => onRemove(org)}
            removeLabel={`Remove ${org} from history`}
          />
        ))
      )}
    </RecentPanel>
  )
}

function RecentPanel({
  label,
  count,
  query,
  onQueryChange,
  searchPlaceholder,
  children,
}: {
  label: string
  count: number
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="h-4 text-xs font-medium text-slate-500 flex items-center gap-1">
        <History className="w-3 h-3 shrink-0" />
        <span className="truncate">{label}</span>
        <span className="font-normal text-slate-400 shrink-0">· {count}</span>
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 pl-8 text-xs"
        />
      </div>
      <div className={`${LIST_HEIGHT} overflow-y-auto overflow-x-hidden rounded-md border border-slate-200 bg-white`}>
        {children}
      </div>
    </div>
  )
}

function HistoryRow({
  label,
  active,
  onSelect,
  onRemove,
  removeLabel,
}: {
  label: string
  active: boolean
  onSelect: () => void
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <div
      className={`flex items-center gap-1 border-b border-slate-100 last:border-b-0 ${
        active ? 'bg-indigo-50' : 'hover:bg-slate-50'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`min-w-0 flex-1 truncate px-2 py-1.5 text-left font-mono text-xs ${
          active ? 'text-indigo-800' : 'text-slate-700'
        }`}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 px-1.5 py-1.5 text-slate-400 hover:text-slate-600"
        aria-label={removeLabel}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

function EmptyFilter({ query }: { query: string }) {
  return (
    <p className="px-2 py-3 text-xs text-slate-500">
      No matches for <span className="font-mono">{query}</span>
    </p>
  )
}
