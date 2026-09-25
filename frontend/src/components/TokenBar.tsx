import { useState } from 'react'
import { Eye, EyeOff, Key } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface Props {
  token: string
  onChange: (value: string) => void
  compact?: boolean
}

export default function TokenBar({ token, onChange, compact = false }: Props) {
  const [showToken, setShowToken] = useState(false)

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${compact ? 'p-4' : 'p-6'}`}>
      <div className={`flex items-start gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Key className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <Label htmlFor="token" className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-slate-900`}>
            GitHub Fine-Grained Personal Access Token
          </Label>
          {!compact && (
            <p className="text-sm text-slate-500 mt-1">
              Stored in memory only – never saved to localStorage. Requires{' '}
              <Badge variant="secondary" className="mx-1">Administration: Read &amp; Write</Badge>
              <Badge variant="secondary" className="mx-1">Issues: Read &amp; Write</Badge>
              <Badge variant="secondary" className="mx-1">Metadata: Read</Badge>
            </p>
          )}
        </div>
      </div>
      <div className="relative">
        <Input
          id="token"
          type={showToken ? 'text' : 'password'}
          value={token}
          onChange={e => onChange(e.target.value)}
          placeholder="github_pat_xxxxxxxxxxxxxxxxxxxx"
          className="pr-24 font-mono text-sm"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-8 gap-1.5 text-slate-500"
          onClick={() => setShowToken(v => !v)}
        >
          {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showToken ? 'Hide' : 'Show'}
        </Button>
      </div>
    </div>
  )
}
