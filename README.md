# Expense Tracker

A personal finance application for tracking expenses and income, with budgets,
spending insights, recurring expenses and CSV/JSON export.

**Stack:** React 18 + Vite · Express 4 · MongoDB / Mongoose · Chart.js · React Query

---

## Features

| Area | What it does |
| --- | --- |
| **Accounts** | Email and password registration, sign-in and sign-out. Every expense, budget and rule belongs to one user and is invisible to everyone else |
| **Dashboard** | Six summary cards (total, this month, last month, daily average, highest expense, transaction count) plus category, monthly-comparison and cumulative-spend charts |
| **Expenses** | Full CRUD with search, category / payment-method / month / date-range filters, sorting and pagination |
| **Income** | The same screen, backed by a separate collection, so the balance stays accurate |
| **Budgets** | An overall monthly budget plus per-category budgets, showing budget / spent / remaining / % used with warning and over-budget states |
| **Insights** | Plain-language observations derived from real aggregations — month-over-month change, dominant category, biggest category swing, daily average, heaviest weekday, budget pressure |
| **Recurring** | Weekly / monthly / yearly rules that materialise into real expenses when they fall due — no scheduler required |
| **Export** | CSV (Excel-safe, BOM-prefixed) and JSON, honouring the filters currently applied |
| **UX** | Light and dark themes, toast notifications, skeleton loading, empty states, retryable error states, confirmation before deletes, responsive down to mobile |

---

## Getting started

### Prerequisites

- Node.js 18+ (developed on 22)
- A MongoDB database — MongoDB Atlas or a local `mongod`

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGO_URL
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend/my-app
npm install
npm run dev               # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so the frontend
works with no `.env` at all. Set `VITE_API_URL` only when the API lives
somewhere else.

---

## Environment variables

### `backend/.env`

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `MONGO_URL` | **yes** | — | MongoDB connection string. The server refuses to start without it. |
| `PORT` | no | `5000` | Port the API listens on |
| `CLIENT_URL` | no | `http://localhost:5173` | Allowed CORS origin(s), comma separated |
| `APP_TIMEZONE` | no | `UTC` | Timezone used to bucket expenses into days and months. Set this to your own zone, e.g. `Europe/Rome`. |
| `CURRENCY` | no | `EUR` | ISO 4217 code used to format amounts |
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `JWT_SECRET` | **yes** | — | Secret used to sign session tokens. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Changing it signs everyone out. |
| `JWT_EXPIRES_IN` | no | `7d` | Session lifetime (`7d`, `12h`, `30m`) |
| `COOKIE_SAMESITE` | no | `lax` | `lax` suits localhost. A frontend on a different site needs `none`. |
| `COOKIE_SECURE` | no | on in production | Send the cookie over HTTPS only |

### `frontend/my-app/.env`

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | no | `/api` (dev proxy) | Base URL of the API |

Both directories ship a `.env.example`. Real `.env` files are git-ignored and
must never be committed.

---

## Commands

### Backend

```bash
npm run dev      # nodemon
npm start        # production
npm test         # Jest + supertest against an in-memory MongoDB
```

### Frontend

```bash
npm run dev      # Vite dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
npm test         # Vitest + React Testing Library
```

---

## Architecture

### Backend

```
backend/
├── app.js               # Express app: security, CORS, parsing, routes, error handling
├── server.js            # DB connection, listen, graceful shutdown
├── config/              # env.js (all process.env access) · db.js
├── constants/           # taxonomy.js — categories & payment methods, single source of truth
├── models/              # Expense · Income · Budget · Recurring (+ shared transactionSchema)
├── validators/          # Zod schemas for body, query and params
├── middleware/          # validate · asyncHandler · errorHandler · notFound
├── services/            # business logic: transactions, dashboard, insights, budgets, recurring
├── controllers/         # thin HTTP layer
├── routes/              # REST routing
├── utils/               # dates · csv · regex · ApiError
└── tests/               # Jest + supertest
```

Expenses and income are structurally identical, so the schema is built once by
a factory and instantiated twice, and one CRUD service factory serves both. They
stay in **separate collections** to preserve the existing data.

### Frontend

```
src/
├── main.jsx             # providers: theme, React Query, toasts, router, error boundary
├── App.jsx              # routes
├── components/
│   ├── ui/              # Button, Card, Field, Modal, ConfirmDialog, Toast, Badge,
│   │                    # ProgressBar, Pagination, MonthPicker, States (skeleton/empty/error)
│   ├── layout/          # AppLayout, Sidebar, PageHeader
│   └── charts/          # chartSetup (registration + theme palette), ChartFrame
├── features/
│   ├── transactions/    # shared by expenses and income: page, form, table, filters, hooks
│   ├── dashboard/       # summary cards, charts, queries
│   ├── budgets/         # form + queries
│   ├── recurring/       # form + queries
│   └── insights/        # insight list
├── pages/               # thin route components
├── hooks/               # queryKeys, useTaxonomy, useDebouncedValue
├── services/            # apiClient (axios + error normalisation), resources (all endpoints)
├── utils/               # format (Intl), dates, download
├── constants/           # nav, page sizes, sort options
├── context/             # ThemeContext, ToastContext
└── styles/              # GlobalStyle — the design tokens
```

**Design system.** Every colour, radius and spacing value is a CSS custom
property defined in `GlobalStyle.js`. Dark mode is a `data-theme` attribute
swap on `<html>`, applied before first paint by a small inline script so there
is no flash. No theme engine, no runtime theme object.

**Server state** lives in React Query, not in a hand-rolled context. It
de-duplicates identical requests, keeps the previous page visible while a
filter change is in flight, and gives every screen real loading and error
states. Mutations invalidate exactly the derived data they affect
(`hooks/queryKeys.js`).

---

## API

All responses use one envelope:

```json
{ "success": true, "data": {}, "meta": {} }
```

```json
{ "success": false, "message": "Expense not found", "errors": [{ "field": "amount", "message": "..." }] }
```

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public. Creates an account and starts a session |
| `POST` | `/api/auth/login` | Public. Starts a session |
| `POST` | `/api/auth/logout` | Clears the session cookie |
| `GET` | `/api/auth/me` | The signed-in user, or 401 |
| `GET` | `/api/health` | Public. Liveness check |
| `GET` | `/api/categories` | Public. Expense and income categories with labels and colours |
| `GET` | `/api/payment-methods` | Payment method list |
| `GET` | `/api/config` | Currency, timezone, recurrence frequencies |
| `GET` | `/api/expenses` | `search`, `category`, `paymentMethod`, `month`, `from`, `to`, `minAmount`, `maxAmount`, `sortBy`, `sortDir`, `page`, `limit` |
| `GET` | `/api/expenses/:id` | |
| `POST` | `/api/expenses` | |
| `PUT` | `/api/expenses/:id` | |
| `DELETE` | `/api/expenses/:id` | |
| `GET` | `/api/expenses/export` | `format=csv\|json`, honours all list filters |
| `GET/POST/PUT/DELETE` | `/api/incomes[/:id]` | Same contract as expenses |
| `GET` | `/api/dashboard` | `month=YYYY-MM`, `months=3..24` |
| `GET` | `/api/insights` | `month=YYYY-MM` |
| `GET` | `/api/budgets` | `month=YYYY-MM` — budgets joined with actual spend |
| `PUT` | `/api/budgets` | Upsert by category (`null` = overall) |
| `DELETE` | `/api/budgets/:id` | |
| `GET/POST/PUT/DELETE` | `/api/recurring[/:id]` | |

Every endpoint below `/api/auth` and the four public ones above requires a
valid session cookie; without one they return `401`.

---

## Data model

`Expense` and `Income` share this shape:

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | required, ≤ 80 chars |
| `amount` | Number | required, > 0 |
| `date` | Date | required, indexed |
| `category` | String | required, enum from `constants/taxonomy.js` |
| `description` | String | optional notes, ≤ 500 chars |
| `paymentMethod` | String | enum, defaults to `other` |
| `type` | String | `expense` / `income`, immutable |
| `recurringId` | ObjectId | set when generated from a recurring rule |

Indexes: `{ date: -1, _id: -1 }` for listing and `{ category: 1, date: -1 }` for
category filters.

`Budget` — one document per line, unique on `category` (`null` = overall).
`Recurring` — template plus `frequency`, `startDate`, `nextRunDate`, `endDate`,
`active`.

### Date handling

A transaction date is a **calendar day**, not an instant. It is stored at
**12:00 UTC** of that day, so shifting it into any timezone between UTC−11 and
UTC+11 still lands on the same day. This removes the classic "expense saved on
the 1st appears on the 31st" bug. Month ranges are half-open `[start, end)`,
and month keys are plain `YYYY-MM` strings.

Set `APP_TIMEZONE` to your own zone so day and month bucketing in the dashboard
matches your calendar.

---

## Security

### Authentication

Session JWTs are delivered in an **httpOnly cookie**, not in the response body.
Client-side JavaScript can never read the token, which removes the XSS
token-theft path that comes with keeping one in `localStorage`.

- Passwords are hashed with **bcrypt** at cost factor 12. The plaintext is
  never stored or logged.
- `passwordHash` is `select: false` on the schema and stripped again in
  `toJSON`, so it cannot leak through a controller that forgets to remove it.
- Login answers identically for an unknown email and a wrong password, and
  hashes a throwaway value when no account exists so the response time does not
  reveal which addresses are registered.
- `/api/auth/login` and `/api/auth/register` are rate limited to 20 failed
  attempts per 15 minutes, separately from the global limit.
- The signing secret comes from `JWT_SECRET`; the server refuses to boot
  without it outside tests.
- The middleware reloads the user on every request, so a deleted account stops
  working immediately rather than when its token expires.

### Authorization

Every financial document carries a `user` reference, and **the owner is taken
from the verified session cookie — never from the request body or query.**

- `requireAuth` is applied once in `routes/index.js` above every data router,
  so a new router cannot be mounted unprotected by accident.
- Reads, updates and deletes all match on `{ _id, user }` together, so a
  request for someone else's record returns `404` rather than `403` — that
  avoids confirming the id exists.
- Aggregations for the dashboard, insights and budgets start with a `$match` on
  the owner, since pipelines bypass the usual query helpers.
- Budget uniqueness is `{ user, category }`, so two users can each budget for
  the same category.
- Generated recurring expenses inherit their rule's owner, never a
  caller-supplied value.

### Transport and input

- **Helmet** for security headers
- **CORS** restricted to `CLIENT_URL` with `credentials: true`; an unlisted
  origin gets a `403`
- **Rate limiting** — 600 requests / 15 min on `/api`
- **Zod validation** on every body, query and param. Controllers only ever see
  parsed, coerced values, which makes Mongo operator injection
  (`{"$gt": ""}`) impossible
- Search input is **regex-escaped** before it reaches a `RegExp`
- JSON body limit of 100 kB
- Errors are mapped centrally; **stack traces are never returned in production**
- Secrets come from environment variables only, and `.env` is git-ignored

## Testing

```bash
cd backend && npm test            # 72 tests
cd frontend/my-app && npm test    # 55 tests
```

**Backend (Jest + supertest + `mongodb-memory-server`)** — expense CRUD,
validation rules, filters, search escaping, pagination stability, CSV/JSON
export, dashboard aggregations, month boundaries, budget thresholds, insight
generation, recurring materialisation (idempotency, end dates, month-length
clamping) and error handling.

**Frontend (Vitest + React Testing Library)** — form validation and submission,
table rendering and actions, filter behaviour, formatting utilities, plus an
integration suite that renders the real app shell and covers routing, dark
mode, dashboard rendering, delete confirmation, error states and empty states.

---

## Production build

```bash
cd frontend/my-app && npm run build   # -> dist/
cd backend && NODE_ENV=production npm start
```

Serve `frontend/my-app/dist` from any static host and point `VITE_API_URL` at
the deployed API, or serve both from the same origin and leave it unset.
