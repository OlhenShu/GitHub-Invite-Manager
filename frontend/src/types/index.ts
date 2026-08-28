export type NamingMode = 'PATTERN' | 'LIST'

export interface CreateReposRequest {
  templateOwner: string
  templateRepo: string
  targetOrg: string
  namingMode: NamingMode
  // PATTERN mode
  baseName?: string
  count?: number
  startIndex?: number
  padding?: number
  // LIST mode
  repoNames?: string[]
  // Common
  visibility: 'private' | 'public' | 'internal'
  includeAllBranches: boolean
  description?: string
}

export type RepoStatus = 'created' | 'already_exists' | 'failed'

export interface RepoResult {
  repoName: string
  status: RepoStatus
  message: string | null
  url: string | null
}

export interface RepoSummary {
  total: number
  created: number
  already_exists: number
  failed: number
}

export interface CreateReposResponse {
  results: RepoResult[]
  summary: RepoSummary
}

export type InviteMode = 'INDIVIDUAL' | 'TEAM'

export interface InviteAssignment {
  repository: string
  username: string
}

export interface InviteRequest {
  rawUsernames: string
  repositories: string[]
  permission: string
  mode: InviteMode
  assignments?: InviteAssignment[]
}

export type InviteStatus = 'invited' | 'already_collaborator' | 'user_not_found' | 'failed'

export interface InviteResult {
  repository: string
  username: string
  status: InviteStatus
  message: string | null
}

export interface InviteSummary {
  total: number
  invited: number
  already_collaborator: number
  user_not_found: number
  failed: number
}

export interface InviteResponse {
  results: InviteResult[]
  summary: InviteSummary
}
