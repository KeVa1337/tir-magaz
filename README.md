# TIR Parts — демо інтернет-магазину запчастин для вантажівок

Тягачі, вантажівки та напівпричепи: каталог з підбором під авто клієнта, «гараж», VIN-підбір з менеджером, кошик і замовлення, адмін-панель з імпортом прайсів. Специфікація — [`SPEC.md`](SPEC.md).

## Швидкий старт

```bash
cp .env.example .env            # і згенеруйте AUTH_SECRET
docker compose up -d db         # PostgreSQL 16
npm install
npx prisma migrate deploy
npm run db:seed                 # демо-дані: 10 марок, ~220 товарів, клієнт з гаражем, замовлення, VIN-запити
npm run dev                     # http://localhost:3000
```

Демо-доступи (пароль `demo1234`): `client@demo.ua` · `manager@demo.ua` · `admin@demo.ua`. На сторінці входу є кнопки швидкого входу (вимикається `DEMO_MODE=false`).

Повне демо на VPS: `AUTH_SECRET=… docker compose --profile app up -d --build`, потім `docker compose exec app npm run db:seed`.

## Що показати власникам

| Сценарій | Де |
|---|---|
| Пошук за номером (OE/крос з дефісами, пробілами), VIN у рядку пошуку, синоніми («подушка» → пневмоподушка) | шапка, `/search` |
| «Моє авто» в шапці → бейджі ✔ / ? / ✖ у каталозі й картці; залежність від номера шасі (супорт DAF XF 106) | `client@demo.ua` → «Білий DAF» |
| Гараж: додавання авто за VIN з автозаповненням, «технічний паспорт», історія покупок з пробігом | `/account/garage` |
| VIN-запит → менеджер додає товари і прив'язує OE до авто → клієнт «Додати все в кошик» | `/vin`, `/admin/vin-requests` |
| Комплекти ТО одним кліком | `/kits` |
| Напівпричепи за марками осей BPW / SAF / ROR | `/trailers` |
| Адмінка: дашборд з SLA, замовлення, товари з інлайн-редагуванням і масовими діями, категорії drag&drop, імпорт XLSX/CSV з шаблонами мапінгу, журнал дій | `/admin` |

## Стек
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · компоненти shadcn/ui-стилю на Radix · PostgreSQL + Prisma 6 (`pg_trgm`) · Auth.js v5 (Credentials, JWT) · Zod · TanStack Table · dnd-kit · ExcelJS + PapaParse.

## Перевірки
```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Обмеження демо (🟡 — після погодження)
- Оплата, Нова Пошта, ПРРО, SMS/Telegram — заглушки; листи пишуться в лог сервера.
- VIN-декодер — локальний (WMI + рік + шасі); TecDoc підключається як ще один `VinProvider`.
- Файли зберігаються на диску (`storage/uploads`) — на Vercel не переживуть деплой, для продакшену — S3/R2.
- Артикули й OE-номери в seed вигадані; WMI-таблицю перевірити перед продакшеном.
