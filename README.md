# Chat Reception Bot

Telegram-бот для приема заявок в чат выпускников ИТМО.

Бот собирает анкету пользователя, отправляет ее в админский чат и после подтверждения выдает одноразовую ссылку на вступление в основной чат. Пользователи идентифицируются по Telegram id (`ctx.from.id`), потому что `username` в Telegram необязателен и может отсутствовать или измениться.

## Stack

- NestJS 10
- nestjs-telegraf / telegraf
- TypeORM
- PostgreSQL
- Jest

## Environment

Создайте `.env` по примеру `env.example`.

```bash
APP_ENV="local"
APP_PORT=3000

BOT_TOKEN=""

DB_HOST="127.0.0.1"
DB_PORT=5432
DB_USER="user"
DB_PASS="pass"
DB_NAME="chat_reception_bot"

GROUP_ID=-1001
ADMINS_GROUP_ID=-1002
```

Переменные:

- `BOT_TOKEN` - токен Telegram-бота от BotFather.
- `GROUP_ID` - id основного чата, куда бот создает invite-ссылки.
- `ADMINS_GROUP_ID` - id админского чата, куда отправляются анкеты и откуда разрешена команда `/verify`.
- `APP_ENV` - в `production` TypeORM `synchronize` отключен.

## Install

```bash
npm install
```

## Run

```bash
npm run start:dev
```

Production build:

```bash
npm run build
npm run start:prod
```

## Bot Flow

1. Пользователь пишет `/start` в личные сообщения боту.
2. Бот сохраняет пользователя по `telegramId`.
3. Пользователь заполняет анкету.
4. Бот отправляет анкету в `ADMINS_GROUP_ID` с кнопками подтверждения.
5. Администратор подтверждает или отклоняет заявку.
6. При подтверждении бот создает одноразовую invite-ссылку в `GROUP_ID` и отправляет ее пользователю в личные сообщения.

## Commands

- `/start` - начать сценарий подачи заявки или проверить текущий статус.
- `/id` - показать id текущего чата и Telegram id пользователя.
- `/checkUser <telegramId>` - найти пользователя по Telegram id.
- `/verify <telegramId>` - вручную подтвердить пользователя по Telegram id. Команда работает только из админского чата.
- `/send` - начать рассылку пользователям, у которых `stayTuned=true`. Доступно администраторам.

## User Identity

Основной идентификатор пользователя - `users.telegramId`.

`username` хранится только как дополнительная подпись для логов и сообщений администраторам. На него нельзя опираться для поиска, верификации или callback-data, потому что:

- у пользователя может не быть `username`;
- пользователь может изменить `username`;
- `username` не является стабильным техническим идентификатором.

В entity добавлен уникальный индекс `idx_users_telegram_id_unique` на `telegramId`. В локальной среде с `synchronize=true` TypeORM применит его автоматически. В production, где `synchronize=false`, индекс нужно добавить миграцией или SQL:

```sql
CREATE UNIQUE INDEX idx_users_telegram_id_unique ON users ("telegramId");
```

Перед добавлением индекса в существующей базе проверьте дубли:

```sql
SELECT "telegramId", COUNT(*)
FROM users
WHERE "telegramId" IS NOT NULL
GROUP BY "telegramId"
HAVING COUNT(*) > 1;
```

## Tests

```bash
npm run test
npm run test:e2e
```

## Notes

- Бот должен быть администратором основного чата, чтобы создавать invite-ссылки.
- Пользователь должен сначала написать боту, иначе Telegram не позволит отправить ему личное сообщение.
- README описывает текущую архитектуру без миграционного слоя. Если проект пойдет в production, стоит добавить TypeORM migrations вместо `synchronize`.
