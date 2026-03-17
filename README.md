# VizForm

Веб-приложение для приёма заявок на 3D-визуализацию с хранением данных в Supabase.

## Railway deployment

Проект подготовлен для деплоя как Node.js service:

- `server.js` — отдаёт статические файлы и слушает `PORT` от Railway.
- `package.json` — содержит `npm start`.
- `railway.json` — базовая политика рестарта.
- `/runtime-config.js` — подставляет runtime-конфиг из переменных окружения.

### Переменные окружения

Добавьте в Railway Variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Если переменные не заданы, используются значения по умолчанию из `js/config.js`.

### Проверка после деплоя

- `GET /health` должен вернуть `{"status":"ok"}`.
- Открыть:
  - `/` (лендинг)
  - `/form.html?cat=exterior`
  - `/admin.html`

## Что важно учесть перед production

- Сейчас вход в админку реализован через `localStorage` (клиентская проверка пароля), это **небезопасно** для production.
- Telegram Bot Token хранится в базе и доступ к нему должен быть ограничен RLS-политиками.
- Для email-уведомлений требуется опубликованная Supabase Edge Function `send-email`.
