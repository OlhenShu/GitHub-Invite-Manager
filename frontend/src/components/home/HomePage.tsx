import { ArrowRight } from 'lucide-react'

export type AppView = 'home' | 'create' | 'invite' | 'issues'

interface Props {
  onSelect: (view: Exclude<AppView, 'home'>) => void
}

function CreateArt() {
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="createSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="320" height="160" rx="16" fill="url(#createSky)" />
      <circle cx="260" cy="28" r="22" fill="#fff" opacity="0.12" />
      <circle cx="40" cy="130" r="36" fill="#fff" opacity="0.08" />
      <g transform="translate(36 38)">
        <rect x="0" y="24" width="72" height="56" rx="8" fill="#fff" opacity="0.92" />
        <rect x="10" y="36" width="40" height="6" rx="3" fill="#93c5fd" />
        <rect x="10" y="50" width="28" height="6" rx="3" fill="#bfdbfe" />
        <rect x="88" y="12" width="80" height="68" rx="8" fill="#fff" />
        <rect x="100" y="26" width="52" height="6" rx="3" fill="#6366f1" />
        <rect x="100" y="40" width="36" height="6" rx="3" fill="#c7d2fe" />
        <rect x="100" y="54" width="44" height="6" rx="3" fill="#c7d2fe" />
        <rect x="184" y="28" width="72" height="56" rx="8" fill="#fff" opacity="0.92" />
        <rect x="194" y="40" width="40" height="6" rx="3" fill="#93c5fd" />
        <rect x="194" y="54" width="28" height="6" rx="3" fill="#bfdbfe" />
      </g>
    </svg>
  )
}

function InviteArt() {
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="inviteSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="320" height="160" rx="16" fill="url(#inviteSky)" />
      <circle cx="36" cy="30" r="20" fill="#fff" opacity="0.12" />
      <circle cx="290" cy="120" r="40" fill="#fff" opacity="0.1" />
      <g fill="#fff">
        <circle cx="92" cy="68" r="18" opacity="0.95" />
        <rect x="68" y="90" width="48" height="28" rx="14" opacity="0.95" />
        <circle cx="160" cy="58" r="22" />
        <rect x="130" y="84" width="60" height="34" rx="17" />
        <circle cx="228" cy="68" r="18" opacity="0.95" />
        <rect x="204" y="90" width="48" height="28" rx="14" opacity="0.95" />
      </g>
      <rect x="138" y="28" width="44" height="28" rx="6" fill="#f5d0fe" />
      <path d="M138 28 L160 44 L182 28" fill="none" stroke="#a21caf" strokeWidth="3" />
    </svg>
  )
}

function CopyArt() {
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="copySky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="320" height="160" rx="16" fill="url(#copySky)" />
      <circle cx="280" cy="24" r="26" fill="#fff" opacity="0.1" />
      <rect x="28" y="36" width="100" height="88" rx="10" fill="#fff" opacity="0.95" />
      <rect x="40" y="50" width="54" height="7" rx="3" fill="#5eead4" />
      <rect x="40" y="66" width="76" height="7" rx="3" fill="#ccfbf1" />
      <rect x="40" y="82" width="64" height="7" rx="3" fill="#ccfbf1" />
      <rect x="40" y="98" width="40" height="7" rx="3" fill="#99f6e4" />
      <path d="M142 80 H178" stroke="#ecfdf5" strokeWidth="4" strokeLinecap="round" />
      <path d="M168 68 L182 80 L168 92" fill="none" stroke="#ecfdf5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="192" y="36" width="100" height="88" rx="10" fill="#fff" opacity="0.95" />
      <rect x="204" y="50" width="54" height="7" rx="3" fill="#34d399" />
      <rect x="204" y="66" width="76" height="7" rx="3" fill="#d1fae5" />
      <rect x="204" y="82" width="64" height="7" rx="3" fill="#d1fae5" />
      <rect x="204" y="98" width="40" height="7" rx="3" fill="#a7f3d0" />
    </svg>
  )
}

const CARDS = [
  {
    id: 'create' as const,
    title: 'Create repositories',
    description: 'Bulk-create student labs from a GitHub template — in an organization or under your own account.',
    hint: 'Pattern names or a list of usernames',
    Art: CreateArt,
  },
  {
    id: 'invite' as const,
    title: 'Invite collaborators',
    description: 'Invite students to new or existing repos. Works for personal accounts and organizations.',
    hint: 'One-to-one or shared team repos',
    Art: InviteArt,
  },
  {
    id: 'issues' as const,
    title: 'Copy issues',
    description: 'Copy issues from a template repo to student repos and keep labels, colors, and descriptions.',
    hint: 'All issues, ranges, or specific numbers',
    Art: CopyArt,
  },
]

export default function HomePage({ onSelect }: Props) {
  return (
    <div className="space-y-10">
      <section className="text-center max-w-2xl mx-auto pt-2">
        <p className="text-xs font-semibold tracking-wider uppercase text-indigo-600 mb-3">Mentor workspace</p>
        <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
          Set up labs, invite students, copy tasks
        </h2>
        <p className="mt-3 text-slate-500 text-base leading-relaxed">
          Three tools for the same workflow: spin up repositories, add collaborators, then copy issues with labels.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CARDS.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className="group text-left bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex flex-col h-full"
          >
            <div className="h-36 overflow-hidden shrink-0">
              <card.Art />
            </div>
            <div className="p-5 flex flex-col flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-lg">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{card.description}</p>
              <p className="mt-3 text-xs text-slate-400">{card.hint}</p>
              <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 group-hover:gap-2.5 transition-all">
                Open
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </button>
        ))}
      </section>
    </div>
  )
}
