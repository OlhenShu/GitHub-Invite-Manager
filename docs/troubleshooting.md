# Типові проблеми

## Failed to fetch / не вдається Load from GitHub

Браузер не достукався до бекенду. Найчастіше:

1. Бекенд не запущений.
2. На **Windows** порт **8080** зайнятий WSL: фронтенд б’ється не в цей застосунок.
3. У `frontend/.env` інший порт, ніж у Spring Boot.

Що зробити:

```powershell
cd backend
$env:PORT='8081'
mvn spring-boot:run
```

У `frontend/.env`:

```env
VITE_API_URL=http://localhost:8081
```

Перезапустіть `npm run dev`, у браузері Ctrl+F5.

Перевірка: у браузері або curl відкрийте `http://localhost:8081/api/health` — має бути `{"status":"ok"}`.

## Порожній список після Load from GitHub

- Режим **My account**, а токен виданий на **організацію** (або навпаки).
- У fine-grained токена **Repository access** = Only selected repositories, а не All.
- Немає права **Administration: Read and write**.

## 401 Invalid token

Токен прострочений, скопійований неповністю, або заголовок не дійшов до бекенду.

## 403 / 404 під час створення або інвайту

- Шаблон не позначений як Template repository.
- Немає права створювати репо в org / на акаунті.
- Для org ви не член організації.
- Студентський юзернейм не існує (інвайт поверне `user_not_found`).

## Internal visibility

Доступна лише з організацією. GitHub generate API приймає лише `private: true/false`, тому Internal фактично створюється як private.

## Rate limit

Бекенд робить паузу 150–200 мс між викликами і до 3 повторів на 429/403/5xx. Якщо ліміт GitHub вичерпано — зачекайте і повторіть.
