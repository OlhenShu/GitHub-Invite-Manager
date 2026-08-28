import { useState } from 'react'
import { Github, Key, GitBranch, Users, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import CreateReposTab from './components/create/CreateReposTab'
import InviteTab from './components/invite/InviteTab'
import { TooltipProvider } from './components/ui/tooltip'

export default function App() {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [createdRepos, setCreatedRepos] = useState<string[]>([])
  const [createdUsernames, setCreatedUsernames] = useState<string[]>([])

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">GitHub Repo &amp; Invite Manager</h1>
              <p className="text-sm text-slate-500">Manage repositories and collaborators efficiently</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Token Section */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <Label htmlFor="token" className="text-base font-semibold text-slate-900">
                GitHub Fine-Grained Personal Access Token
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Stored in memory only – never saved to localStorage or sent to any server other than GitHub.
                Requires{' '}
                <Badge variant="secondary" className="mx-1">Administration: Read &amp; Write</Badge>
                <Badge variant="secondary" className="mx-1">Metadata: Read</Badge>
              </p>
            </div>
          </div>
          <div className="relative">
            <Input
              id="token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={e => setToken(e.target.value)}
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

        {/* Tabs */}
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white shadow-sm border border-slate-200 h-12">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Create Repositories
            </TabsTrigger>
            <TabsTrigger
              value="invite"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md transition-all"
            >
              <Users className="w-4 h-4 mr-2" />
              Invite Collaborators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <CreateReposTab
                token={token}
                onReposCreated={(repos, usernames) => {
                  setCreatedRepos(repos)
                  setCreatedUsernames(usernames ?? [])
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="invite">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <InviteTab token={token} suggestedRepos={createdRepos} initialUsernames={createdUsernames} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </TooltipProvider>
  )
}
