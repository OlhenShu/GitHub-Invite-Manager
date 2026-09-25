export type NamingMode = 'PATTERN' | 'LIST'

export interface CreateReposRequest {
  templateOwner: string
  templateRepo: string
  targetOrg?: string
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
  fullName: string | null
}

export interface AuthenticatedUser {
  login: string
  htmlUrl: string
}

export interface ExistingRepo {
  fullName: string
  htmlUrl: string
  private: boolean
  owner: string
  ownerType: string
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

export interface RepoLabel {
  name: string
  color: string
  description: string
}

export interface SourceIssue {
  number: number
  title: string
  body: string
  state: string
  url: string | null
  labels: string[]
}

export interface IssuePreviewResponse {
  repository: string
  issues: SourceIssue[]
  labels: RepoLabel[]
}

export interface CopyIssuesRequest {
  sourceRepo: string
  targetRepo: string
  includeClosed: boolean
  preserveClosedState: boolean
  issueNumbers?: number[]
}

export type IssueCopyStatus = 'copied' | 'skipped' | 'failed'

export interface IssueCopyResult {
  sourceNumber: number
  title: string
  status: IssueCopyStatus
  message: string | null
  url: string | null
  labels: string[]
}

export interface LabelCopyResult {
  name: string
  status: 'created' | 'already_exists' | 'failed'
  message: string | null
}

export interface CopyIssuesResponse {
  results: IssueCopyResult[]
  labels: LabelCopyResult[]
  summary: {
    total: number
    copied: number
    skipped: number
    failed: number
  }
  labelSummary: {
    total: number
    created: number
    already_exists: number
    failed: number
  }
}

export interface LabelColorResult {
  name: string
  previousColor: string | null
  color: string
  status: 'updated' | 'failed'
  message: string | null
}

export interface RandomizeLabelsResponse {
  repository: string
  results: LabelColorResult[]
  summary: {
    total: number
    updated: number
    failed: number
  }
}
