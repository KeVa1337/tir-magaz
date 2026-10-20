# CLAUDE.md — правила проєкту TIR Parts

Повна специфікація — `SPEC.md` (етапи, дані, сценарії). Перед кожним етапом прочитай її.
Next.js тут 16.x — перед роботою з API фреймворку дивись `node_modules/next/dist/docs/` (див. `AGENTS.md`).

## Команди
- `npm run dev` — dev-сервер (потрібна БД: `docker compose up -d db`)
- `npm run db:migrate` · `npm run db:seed` · `npm run db:reset` — міграції / демо-дані / перестворення БД
- `npm run lint` · `npm run typecheck` · `npm test` — перевірки перед комітом
- `npm run build && npm start` — продакшен-збірка

## Архітектура (SPEC §13)
- Бізнес-логіка — **тільки** в `src/server/services/*` (адмінські — `src/server/services/admin/*`).
- Компоненти не ходять у Prisma напряму. Сторінки (server components) викликають сервіси; мутації — через Server Actions у `src/server/actions/*`.
- Кожна мутація в адмінці пише `AuditLog` (`logAudit` із `services/audit.ts`).
- Права: `requireRole()` у сторінках/layout'ах, `assertRole()` у server actions. `src/proxy.ts` — лише оптимістична перевірка cookie.
- Ролі: CUSTOMER < MANAGER < ADMIN. Імпорт, налаштування і співробітники — тільки ADMIN.
- Ціни — `Decimal` у БД; у клієнтські компоненти передавати лише числа (`toNumber`). Відображення — `formatPrice` (`src/lib/format.ts`) — він стабілізує вивід Intl між Node і браузером.
- Номери деталей і VIN — завжди через `normalize()` (`src/lib/normalize.ts`) при збереженні і пошуку.
- Підбір під авто: чисті правила — `services/fitment-rules.ts` (покрито тестами), Prisma-фільтр і контекст «Моє авто» (cookie `tir_ctx`) — `services/fitment.ts`.
- VIN: `src/server/vin/*` — інтерфейс `VinProvider`; новий провайдер (TecDoc 🟡) додається в масив `providers` у `service.ts`.
- Файли: `services/uploads.ts` → `storage/uploads`, віддаються через `/api/files/...` (🟡 S3/R2).
- Сповіщення: `services/notify.ts` (у демо — лог у консоль).

## UI
- Tailwind v4 + компоненти в стилі shadcn/ui у `src/components/ui` (написані вручну на `radix-ui`, бо реєстр shadcn недоступний у середовищі).
- Токени кольорів — `src/app/globals.css` (графіт + сигнальний бурштин `--primary`, статуси `--success/--warning/--danger`). Нові кольори — тільки через токени.
- Номери/артикули/VIN — `font-num` або `<PartNumber>` (з кнопкою «копіювати»).
- Мобільна версія — пріоритет: великі зони натискання, без горизонтального скролу (перевіряй на 375px).
- Тексти інтерфейсу — українською.

## Демо-доступи
`admin@demo.ua`, `manager@demo.ua`, `client@demo.ua` — пароль `demo1234`.
