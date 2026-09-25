import { useMemo } from 'react'
import { generateRepoNames } from '../../utils/nameGenerator'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface PatternConfig {
  baseName: string
  count: number
  startIndex: number
  padding: number
}

interface Props {
  value: PatternConfig
  onChange: (v: Partial<PatternConfig>) => void
}

export default function NamingPatternForm({ value, onChange }: Props) {
  const preview = useMemo(
    () => generateRepoNames(value.baseName, value.count, value.startIndex, value.padding),
    [value.baseName, value.count, value.startIndex, value.padding],
  )
  const shown = preview.slice(0, 6)
  const more = preview.length - shown.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="base-name" className="text-sm font-medium">
            Base name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="base-name"
            value={value.baseName}
            onChange={e => onChange({ baseName: e.target.value })}
            placeholder="lab"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="count" className="text-sm font-medium">
            Count (1–200) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={200}
            value={value.count}
            onChange={e => onChange({ count: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="start-index" className="text-sm font-medium">Start index</Label>
          <Input
            id="start-index"
            type="number"
            min={0}
            value={value.startIndex}
            onChange={e => onChange({ startIndex: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="padding" className="text-sm font-medium">Zero-padding digits</Label>
          <Input
            id="padding"
            type="number"
            min={1}
            max={10}
            value={value.padding}
            onChange={e => onChange({ padding: parseInt(e.target.value) || 2 })}
          />
        </div>
      </div>

      {shown.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Preview ({preview.length} repos)</p>
          <div className="flex flex-wrap gap-1.5">
            {shown.map(name => (
              <span key={name} className="font-mono text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700">
                {name}
              </span>
            ))}
            {more > 0 && (
              <span className="text-xs text-slate-400 py-1">… and {more} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
