import { useState } from 'react'
import { ArrowLeft, Github } from 'lucide-react'
import { Button } from './components/ui/button'
import CreateReposTab from './components/create/CreateReposTab'
import InviteTab from './components/invite/InviteTab'
import CopyIssuesTab from './components/issues/CopyIssuesTab'
import HomePage, { type AppView } from './components/home/HomePage'
import TokenBar from './components/TokenBar'
import { TooltipProvider } from './components/ui/tooltip'

const FEATURE_TITLES: Record<Exclude<AppView, 'home'>, string> = {
  create: 'Create repositories',
  invite: 'Invite collaborators',
  issues: 'Copy issues',
}

export default function App() {
  const [view, setView] = useState<AppView>('home')
  const [token, setToken] = useState('')
  const [createdRepos, setCreatedRepos] = useState<string[]>([])
  const [createdUsernames, setCreatedUsernames] = useState<string[]>([])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <header className="bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setView('home')}
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shrink-0"
                aria-label="Go to home"
              >
                <Github className="w-6 h-6 text-white" />
              </button>
              <div className="min-w-0">
                <h1 className="font-semibold text-slate-900">GitHub Repo &amp; Invite Manager</h1>
                <p className="text-sm text-slate-500 truncate">
                  {view === 'home' ? 'Choose a tool to get started' : FEATURE_TITLES[view]}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {view === 'home' ? (
            <>
              <HomePage onSelect={setView} />
              <div className="mt-10">
                <TokenBar token={token} onChange={setToken} />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <Button type="button" variant="ghost" className="gap-2 text-slate-600 -ml-2" onClick={() => setView('home')}>
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Button>
              <TokenBar token={token} onChange={setToken} compact />
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                {view === 'create' && (
                  <CreateReposTab
                    token={token}
                    onReposCreated={(repos, usernames) => {
                      setCreatedRepos(repos)
                      setCreatedUsernames(usernames ?? [])
                    }}
                  />
                )}
                {view === 'invite' && (
                  <InviteTab token={token} suggestedRepos={createdRepos} initialUsernames={createdUsernames} />
                )}
                {view === 'issues' && (
                  <CopyIssuesTab token={token} suggestedRepos={createdRepos} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
