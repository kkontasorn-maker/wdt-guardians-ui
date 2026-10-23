# Soft Launch membership + payment spine

Scaffold for Guardians membership persistence and Omise webhook activation. **Does not replace** the existing UI mock / `localStorage` flows.

## What landed

| Piece | Location |
| --- | --- |
| Plan constants (`wdt199` / `wdt399` / `wdt999`, annual = 10× monthly) | `lib/spine/plans.ts` |
| State machine `pending → active → past_due → grace → cancelled` | `lib/spine/states.ts` |
| Drizzle SQLite schema (Member, Subscription, PaymentAttempt, AuditEvent) | `lib/spine/schema.ts` |
| In-memory / SQLite store (`DATABASE_URL` switch) | `lib/spine/store/` |
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

## What still needs humans

- Omise merchant KYC + real test/live keys (`OMISE_*`)
- Real webhook HMAC verification (placeholder accepts non-empty signature when secret is set)
- Thai copy review for join / receipts
- Account migration off browser `localStorage` → these APIs (wire data source only; keep JSX)
- Postgres production `DATABASE_URL` + migrations (schema shapes ready; adapter stubbed)
- Staff auth on `/admin` before Soft Launch traffic

No Omise KYC, Thai review, or account migration is required to develop or build this spine.
