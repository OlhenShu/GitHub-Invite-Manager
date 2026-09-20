# GitHub-токен

Fine-grained PAT прив’язаний до **одного** resource owner: або ваш користувач, або **одна** організація. Одним таким токеном не покрити і особисті репо, і чужу org.

Classic PAT зі scope `repo` може працювати і з особистими репо, і з організацією.

Токен вводять у полі вгорі UI. Він не зберігається між перезавантаженнями сторінки.

## Особистий акаунт (без організації)

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. **Generate new token**.
3. **Resource owner** = ваш користувач.
4. **Repository access** = **All repositories** (інакше не вийде створювати нові репо з шаблону).
5. Permissions:
   - **Administration → Read and write**
   - **Metadata → Read** (зазвичай уже увімкнено)
6. Скопіюйте токен одразу (`github_pat_…`).

## Організація

Ті самі кроки, але:

- **Resource owner** = організація;
- **Repository access** = All repositories;
- ви маєте бути членом організації з правом створювати репо і додавати collaborators.

## Що обрати

| Задача | Resource owner токена |
|--------|------------------------|
| Створити / інвайтнути в `yourname/lab-01` | ваш користувач |
| Створити / інвайтнути в `my-org/lab-01` | організація `my-org` |
| І те, і те одним токеном | classic PAT з `repo`, або два fine-grained токени |

Якщо натиснути **Load from GitHub** у режимі **My account**, а токен виданий на організацію, список буде порожній або GitHub поверне 403/404.
