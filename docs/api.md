# API

База локально: `http://localhost:8080` або `http://localhost:8081`.  
Токен: заголовок `X-GitHub-Token` (має пріоритет над змінною оточення `GITHUB_TOKEN`).

| Метод | Шлях | Опис |
|-------|------|------|
| `GET` | `/api/health` | Перевірка, що бекенд живий |
| `GET` | `/api/user` | Користувач токена (`login`, `htmlUrl`) |
| `GET` | `/api/repos` | Список існуючих репо. Без query — особисті (`affiliation=owner`). `?org=my-org` — репо організації |
| `POST` | `/api/repos/generate` | Масове створення з шаблону |
| `POST` | `/api/invites/send` | Масові запрошення collaborators |

## Створення в організації

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

## Створення без організації

Поле `targetOrg` не передають (або порожній рядок). Репо з’являються під автентифікованим користувачем.

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

У відповіді кожен елемент має `fullName` у форматі `owner/repo`.

## Список імен (LIST)

```json
{
  "templateOwner": "my-org",
  "templateRepo": "lab-template",
  "namingMode": "LIST",
  "repoNames": ["lab-alice", "lab-bob"],
  "visibility": "private",
  "includeAllBranches": false
}
```

## Запрошення

```json
{
  "rawUsernames": "octocat\n@hubot\ndefunkt",
  "repositories": ["my-username/lab-01", "my-org/lab-02"],
  "permission": "push",
  "mode": "INDIVIDUAL"
}
```

`mode`: `INDIVIDUAL` (1-до-1) або `TEAM`. Для TEAM можна передати `assignments`: `[{ "username": "alice", "repository": "my-username/lab-01" }]`.
