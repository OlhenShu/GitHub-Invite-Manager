import type {
  AuthenticatedUser,
  CopyIssuesRequest,
  CopyIssuesResponse,
  CreateReposRequest,
  CreateReposResponse,
  ExistingRepo,
  InviteRequest,
  InviteResponse,
  IssuePreviewResponse,
  RandomizeLabelsResponse,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }
  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    })
  } catch {
    const target = BASE_URL || window.location.origin
    throw new Error(
      `Failed to reach the backend at ${target}. If port 8080 is already in use, start the API on another port (e.g. 8081) and set VITE_API_URL.`,
    )
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json()
      message = err.message || err.error || message
    } catch {
      // ignore parse error
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export async function createRepos(token: string, req: CreateReposRequest): Promise<CreateReposResponse> {
  return request('/api/repos/generate', {
    method: 'POST',
    headers: { 'X-GitHub-Token': token },
    body: JSON.stringify(req),
  })
}

export async function sendInvites(token: string, req: InviteRequest): Promise<InviteResponse> {
  return request('/api/invites/send', {
    method: 'POST',
    headers: { 'X-GitHub-Token': token },
    body: JSON.stringify(req),
  })
}

export async function checkHealth(): Promise<{ status: string }> {
  return request('/api/health', { method: 'GET' })
}

export async function getAuthenticatedUser(token: string): Promise<AuthenticatedUser> {
  return request('/api/user', {
    method: 'GET',
    headers: { 'X-GitHub-Token': token },
  })
}

export async function listRepos(token: string, org?: string): Promise<ExistingRepo[]> {
  const qs = org?.trim() ? `?org=${encodeURIComponent(org.trim())}` : ''
  return request(`/api/repos${qs}`, {
    method: 'GET',
    headers: { 'X-GitHub-Token': token },
  })
}

export async function previewIssues(
  token: string,
  source: string,
  includeClosed: boolean,
): Promise<IssuePreviewResponse> {
  const qs = `?source=${encodeURIComponent(source)}&includeClosed=${includeClosed}`
  return request(`/api/issues/preview${qs}`, {
    method: 'GET',
    headers: { 'X-GitHub-Token': token },
  })
}

export async function copyIssues(token: string, req: CopyIssuesRequest): Promise<CopyIssuesResponse> {
  return request('/api/issues/copy', {
    method: 'POST',
    headers: { 'X-GitHub-Token': token },
    body: JSON.stringify(req),
  })
}

export async function randomizeLabelColors(token: string, repository: string): Promise<RandomizeLabelsResponse> {
  return request('/api/issues/labels/randomize', {
    method: 'POST',
    headers: { 'X-GitHub-Token': token },
    body: JSON.stringify({ repository }),
  })
}
