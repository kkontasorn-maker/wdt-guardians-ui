# Soft Launch membership + payment spine

Scaffold for Guardians membership persistence and Omise webhook activation. **Does not replace** the existing UI mock / `localStorage` flows.

## What landed

| Piece | Location |
| --- | --- |
| Plan constants (`wdt199` / `wdt399` / `wdt999`, annual = 10× monthly) | `lib/spine/plans.ts` |
| State machine `pending → active → past_due → grace → cancelled` | `lib/spine/states.ts` |
| Drizzle SQLite schema (Member, Subscription, PaymentAttempt, AuditEvent) | `lib/spine/schema.ts` |
| In-memory / SQLite / Turso libSQL store (`DATABASE_URL` switch) | `lib/spine/store/` |
| API stubs | `app/api/membership/*`, `app/api/webhooks/omise` |

Activation **only** after a confirmed charge event (`paymentConfirmed=true` on the state machine). Client-side join success must not mark membership active.

## Local run

```bash
npm install
cp .env.example .env.local   # optional; empty DATABASE_URL = in-memory
npm run dev                  # http://localhost:43127
npm test                     # vitest (state machine + service)
npm run build
```

Optional SQLite file (no Docker):

```bash
mkdir -p data
# in .env.local:
# DATABASE_URL=file:./data/guardians.sqlite
```

### Vercel Soft Launch (durable)

In-memory and `file:` SQLite are **not durable** across Vercel serverless instances. Use **Turso**:

1. Create a free DB at https://turso.tech
2. Vercel env (Production):
   - `DATABASE_URL=libsql://…turso.io`
   - `TURSO_AUTH_TOKEN=…`
3. Redeploy

Admin **Payments / Failed Payments** merge live `payment_attempts` from the spine into the Soft Launch book (`GET /api/admin/book`).

### Smoke APIs

```bash
# Pending intent (not active yet)
curl -s -X POST http://localhost:43127/api/membership/join \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.co","firstName":"A","lastName":"B","planId":"wdt399","interval":"monthly"}'

# Webhook skeleton (no Omise keys required locally)
curl -s -X POST http://localhost:43127/api/webhooks/omise \
  -H 'content-type: application/json' \
  -d '{"id":"evnt_1","key":"charge.complete","data":{"id":"chrg_1","object":"charge","status":"successful","metadata":{"subscription_id":"<from join>"}}}'

# Lookup
curl -s http://localhost:43127/api/membership/WDTG-xxxxxx
```

## Admin Soft Launch

1. Set `ADMIN_PASSWORD`, `ADMIN_ALLOWLIST`, `ADMIN_SESSION_SECRET` in `.env.local`
2. Open http://localhost:43127/admin/login
3. Sign in with an allowlisted email + shared password
4. Console reads the shared admin book (`GET /api/admin/book`, seeded + persisted under `data/`)

## Member portal sign-in

Guardians (not staff) sign in at `/manage/login` with **Guardian ID + join email**.
Session cookie is separate from admin. `/manage` loads the membership from the spine/admin book when signed in; localStorage remains a fallback.

## Card join (Omise.js)

With `NEXT_PUBLIC_OMISE_PUBLIC_KEY` + secret key set, `/join` (card) opens Omise’s form, sends **token only** to `POST /api/membership/charge`, activates when paid / webhook confirms.

## PromptPay join

1. `/join` → PromptPay → `POST /api/membership/join` (pending) → `POST /api/membership/promptpay` (QR charge)
2. `/join/promptpay` shows QR and polls `GET /api/membership/charges/:id`
3. When Omise marks the charge paid (poll or `POST /api/webhooks/omise`), subscription **pending → active**

Public webhook URL (Vercel) is required for reliable PromptPay; localhost alone will not receive Omise events.

## What still needs humans

- WDT official Omise merchant (swap keys when ready)
- Thai copy review for join / receipts
- Turso `DATABASE_URL` + `TURSO_AUTH_TOKEN` on Vercel (Soft Launch)
- Postgres production adapter later
- Public webhook URL (Vercel / tunnel) for Omise events
- Soft Launch audience + booth venue confirmation

Personal Omise **test** keys are enough to develop Soft Launch.
