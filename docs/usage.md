# Як користуватись

Спочатку вставте токен у верхнє поле.

## Створення репозиторіїв

Вкладка **Create Repositories**.

1. **Template owner** і **Template repository** — шаблон (особистий або org). У налаштуваннях шаблону має стояти **Template repository**.
2. **Target organization**
   - порожньо → репо створюються під вашим акаунтом;
   - `my-org` → репо в організації.
3. **Visibility:** private / public. **Internal** доступне лише коли вказана організація.
4. Іменування:
   - **Pattern + Counter** — `lab-01`, `lab-02`, …;
   - **Custom List** — список GitHub-юзернеймів студентів; ім’я репо = `{template}-{username}`.

Після успішного створення повні імена `owner/repo` підхоплюються на вкладку Invite.

## Запрошення студентів

Вкладка **Invite Collaborators**.

### Звідки взяти репозиторії

Можна комбінувати:

1. Репо **з цієї сесії** створення.
2. **Existing repositories**
   - **My account** — особисті репо, без організації. **Load from GitHub**.
   - **Organization** — вказати org і завантажити її репо.
3. **Additional repositories** — вручну, по одному `owner/repo` на рядок:

   ```text
   yourname/lab-01
   my-org/lab-02
   ```

### Кого запрошувати

Список GitHub-юзернеймів (по одному на рядок, `#` — коментар). Можна завантажити `.txt`.

### Режими

- **Individual** — перший студент до першого репо, другий до другого, і так далі.
- **Team** — клікаєте студента і призначаєте його на спільне репо.

**Permission** (для org-репо): `pull`, `push`, `triage`, `maintain`, `admin`.  
Для особистих репо GitHub зазвичай дає write (`push`). Якщо поле permission відхилено, бекенд повторить запит без нього.

## Типовий сценарій ментора без org

1. Токен з resource owner = ви.
2. Create: шаблон ваш або чужий template, **Target organization порожнє**.
3. Invite: **My account → Load from GitHub**, вибрати репо, вставити юзернейми студентів, **Send**.
