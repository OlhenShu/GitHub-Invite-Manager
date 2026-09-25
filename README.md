# GitHub Repo & Invite Manager

A web application for:
1. **Bulk-creating GitHub repositories** from a template — in an organisation **or under your personal account**.
2. **Bulk-inviting collaborators** to those repositories, or to **already existing** personal/org repos.
3. **Copying issues** from one repository to another **with labels** (name, color, description), and **randomizing label colors** on a chosen repo.

**Stack:** Java 17 + Spring Boot 3 (backend) · React + Vite + TypeScript + Tailwind (frontend)

**Документація українською:** [docs/](docs/README.md) — огляд, запуск, токен, сценарії, API, типові помилки.

---

## Prerequisites

- Java 17+, Maven 3.9+ (or Docker + Docker Compose)
- Node 20+ (for local frontend dev)
- A GitHub **Fine-Grained Personal Access Token** or a classic PAT with `repo` scope (see below)

---

## Creating a GitHub Fine-Grained Token

A fine-grained token is bound to **one** resource owner: either your user account **or** a single organisation. It cannot manage both personal repos and a different org at the same time. A **classic** PAT with the `repo` scope can cover both.

### Personal account (no organisation)

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set **Resource owner** to **your user account**
4. Set **Repository access** to **All repositories** (required to create new repos from a template)
5. Under **Repository permissions** set:
   - **Administration → Read and write** — create repos and manage collaborators
   - **Issues → Read and write** — copy issues and randomize label colors
   - **Metadata → Read-only** — enabled by default, do not remove
6. Click **Generate token** and copy it immediately

### Organisation

1. Same path as above
2. Set **Resource owner** to the **organisation** you want to manage
3. Set **Repository access** to **All repositories** (if you pick "Only select repositories", the token won't be able to create new ones)
4. Same **Administration**, **Issues**, and **Metadata** permissions as above

> The token is sent from your browser to the app backend, which then calls GitHub.  
> It is **never** stored in localStorage, cookies, or any database — only in the browser's in-memory React state for the duration of your session.

---

## Running locally (without Docker)

### Backend

```bash
cd backend

# Option A — with token as env variable (recommended)
GITHUB_TOKEN=github_pat_YOUR_TOKEN mvn spring-boot:run

# Option B — without env variable (enter token in the UI)
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**. If that port is already in use (common with WSL on Windows), run on 8081:

```powershell
cd backend
$env:PORT='8081'
mvn spring-boot:run
```

Then set `VITE_API_URL=http://localhost:8081` in `frontend/.env`.

### Frontend

```bash
cd frontend
cp .env.example .env        # sets VITE_API_URL=http://localhost:8080
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Running with Docker Compose

```bash
# Set your token in the environment (optional — can also be entered in UI)
export GITHUB_TOKEN=github_pat_YOUR_TOKEN

docker compose up --build
```

- Frontend: **http://localhost:3000**
- Backend API: **http://localhost:8080/api**

In Docker mode the frontend nginx proxies `/api/*` to the backend, so no CORS setup is needed.

---

## Running tests

```bash
cd backend
mvn test
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/user` | Authenticated GitHub user for the token |
| `GET` | `/api/repos` | List existing repos (`?org=my-org` to filter by organisation) |
| `POST` | `/api/repos/generate` | Bulk-create repos from template |
| `POST` | `/api/invites/send` | Bulk-send collaborator invitations |
| `GET` | `/api/issues/preview` | List issues and labels from a source repo |
| `POST` | `/api/issues/copy` | Copy issues and labels to a target repo |
| `POST` | `/api/issues/labels/randomize` | Assign random colors to every label on a repo |

Pass the token via `X-GitHub-Token` request header (takes priority over the `GITHUB_TOKEN` env variable).

### `POST /api/repos/generate` — organisation

```json
{
  "templateOwner": "my-org",
  "templateRepo": "lab-template",
  "targetOrg": "my-org",
  "namingMode": "PATTERN",
  "baseName": "lab",
  "count": 30,
  "startIndex": 1,
  "padding": 2,
  "visibility": "private",
  "includeAllBranches": false,
  "description": "Student lab: {name}"
}
```

### `POST /api/repos/generate` — personal account (`targetOrg` omitted)

```json
{
  "templateOwner": "my-username",
  "templateRepo": "lab-template",
  "namingMode": "PATTERN",
  "baseName": "lab",
  "count": 5,
  "startIndex": 1,
  "padding": 2,
  "visibility": "private",
  "includeAllBranches": false
}
```

Or with a custom list:

```json
{
  "templateOwner": "my-org",
  "templateRepo": "lab-template",
  "targetOrg": "my-org",
  "namingMode": "LIST",
  "repoNames": ["repo-alice", "repo-bob", "repo-charlie"],
  "visibility": "private",
  "includeAllBranches": false
}
```

Each result includes `fullName` (`owner/repo`) so invites can target personal or org repositories without guessing the owner.

### `GET /api/repos` — existing repositories

- No query: repositories the token can access (`GET /user/repos`)
- `?org=my-org`: repositories in that organisation (`GET /orgs/{org}/repos`)

### `POST /api/invites/send` — example body

```json
{
  "rawUsernames": "octocat\n@hubot\ndefunkt",
  "repositories": ["my-username/lab-01", "my-org/lab-02"],
  "permission": "push"
}
```

`repositories` is a list of `owner/repo` values — personal or organisation, existing or just created.

---

## Input file formats

**usernames.txt** (for Invite tab):
```
# comment lines are ignored
octocat
@hubot
  defunkt
```
→ parsed as `["octocat", "hubot", "defunkt"]`

**repo-names.txt** (for Create tab, List mode):
```
repo-alice
repo-bob
repo-charlie
# this line is ignored
```

---

## Notes & limitations

- **Rate limits:** the backend processes requests sequentially with a small delay (150–200 ms) between calls and retries up to 3 times with exponential back-off on 429/403/5xx responses.
- **Personal vs org:** omit `targetOrg` (or leave the field empty in the UI) to create repositories under the authenticated user. The template itself may be personal or in an organisation.
- **`internal` visibility:** only valid when creating in an organisation. GitHub's template-generation endpoint only accepts `private: boolean`; internal is created as private. Adjust visibility afterward in GitHub if needed.
- Turn on **Include all branches from template** if the template has more than the default branch; otherwise GitHub copies only the default branch.
- The template repository must be marked as a **Template repository** in its settings.
- For organisation creation, the token owner must be a **member** of `targetOrg` with sufficient permissions.
- One fine-grained token cannot cover both a personal account and a different organisation. Use two tokens, or a classic PAT with `repo` scope.
