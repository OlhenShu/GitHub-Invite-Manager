interface Props {
  value: string
  onChange: (v: string) => void
}

export default function TokenInput({ value, onChange }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        GitHub Fine-Grained Personal Access Token
      </label>
      <input
        type="password"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="github_pat_..."
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="mt-1 text-xs text-gray-500">
        Stored in memory only – never saved to localStorage or sent to any server other than GitHub.
        Requires <strong>Administration: Read &amp; Write</strong> + <strong>Metadata: Read</strong>.
      </p>
    </div>
  )
}
