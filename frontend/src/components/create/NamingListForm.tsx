import { useMemo, useRef } from 'react'
import { Upload } from 'lucide-react'
import { buildRepoNamesFromUsernames, parseUsernames } from '../../utils/nameGenerator'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

interface Props {
  value: string
  templateRepo: string
  onChange: (raw: string) => void
}

export default function NamingListForm({ value, templateRepo, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const usernames = useMemo(() => parseUsernames(value), [value])
  const preview = useMemo(
    () => buildRepoNamesFromUsernames(templateRepo, usernames),
    [templateRepo, usernames],
  )
  const shown = preview.slice(0, 6)
  const more = preview.length - shown.length
  const prefix = templateRepo.trim()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          GitHub usernames <span className="text-red-500">*</span>
          <span className="text-slate-400 font-normal ml-1">(one per line)</span>
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5 text-slate-500 h-8">
          <Upload className="w-3.5 h-3.5" />
          Upload .txt
        </Button>
        <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
      </div>
      <p className="text-xs text-slate-500">
        Each repo is named <code className="bg-slate-100 px-1 rounded">{prefix || '{template}'}-{'{username}'}</code>
        {' '}– e.g. <code className="bg-slate-100 px-1 rounded">css-modules-next-Username</code>
      </p>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={6}
        placeholder={'Username\noctocat\n@hubot\n# lines starting with # are ignored'}
        className="font-mono text-sm"
      />
      {usernames.length > 0 && !prefix && (
        <p className="text-xs text-amber-600">
          {usernames.length} username{usernames.length !== 1 ? 's' : ''} parsed. Enter a template repository name to preview generated repo names.
        </p>
      )}
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
