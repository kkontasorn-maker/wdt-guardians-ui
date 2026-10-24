# Soft Launch — system requirements (locked)

Asia/Bangkok. Soft Launch **10 Dec 2026**. Scope is limited rollout, not full platform.

## Goals

1. Officers can sign in to `/admin` and review console features against a **shared book**.
2. Join can create a **pending** membership and charge via **Omise test keys** (personal merchant OK until WDT official).
3. Membership becomes **active** only after Omise webhook confirmation.

## Auth (admin)

| Item | Soft Launch choice |
| --- | --- |
| Gate | Shared password + email allowlist |
| Officer (now) | `kriengkrai.info@gmail.com` (administrator) |
| Env | `ADMIN_PASSWORD`, `ADMIN_ALLOWLIST`, `ADMIN_SESSION_SECRET` |
| Later | Magic link / OAuth if needed |

## Payments

- **Omise.js** in the browser — never send raw card data to our server (Omise policy).
- Server receives **token only** → creates charge with secret key.
- Webhook = payment truth → state machine `payment_confirmed` with `paymentConfirmed=true`.
- Test keys on personal Omise account until WDT merchant is approved; then swap keys only.

## Data

- Local/dev: SQLite `DATABASE_URL=file:./data/guardians.sqlite`.
- Admin book seeded from the existing demo roster; live joins append.
- Public join/manage may still mirror into `localStorage` for UX; spine store is source of truth for activation.

## Non-goals (Soft Launch)

- Full OAuth SSO, bank debit, automated Line dunning, bilingual content admin, WordPress.

## Related

- `docs/soft-launch-spine.md` — spine local run
- Development plan in Project Context
