# Запуск

## Вимоги

- Java 17+ і Maven 3.9+
- Node 20+ (для локального фронтенду)
- GitHub-токен (див. [token.md](token.md))

## Локально, без Docker

### 1. Бекенд

```powershell
cd backend
mvn spring-boot:run
```

За замовчуванням API слухає **http://localhost:8080**.

Якщо порт 8080 зайнятий (на Windows часто WSL), запустіть на 8081:

```powershell
cd backend
$env:PORT='8081'
mvn spring-boot:run
```

### 2. Фронтенд

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Відкрийте **http://localhost:5173**.

У `.env` має збігатися порт API:

```env
# якщо бекенд на 8080
VITE_API_URL=http://localhost:8080

# якщо бекенд на 8081
VITE_API_URL=http://localhost:8081
```

Після зміни `.env` перезапустіть `npm run dev` і оновіть сторінку (Ctrl+F5).

Vite також проксує `/api` на `VITE_API_URL`. Якщо залишити `VITE_API_URL` порожнім, запити йдуть на той самий origin (`5173/api`).

## Docker

```powershell
docker compose up --build
```

- UI: http://localhost:3000
- API: http://localhost:8080/api

У Docker nginx проксує `/api/*` на бекенд.

## Тести

```powershell
cd backend
mvn test
```
