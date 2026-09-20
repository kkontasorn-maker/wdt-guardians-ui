# WDT Guardians UI

UI prototype for **WDT Guardians**, the recurring membership program of **Watchdog Thailand Foundation** — animal welfare and stray-animal protection based in Chiang Mai, Thailand.

This is a Next.js 14 App Router app with TypeScript, Tailwind CSS, and shadcn/ui. Membership state lives in the browser (`localStorage`). There is no database, no auth, and no real payment processor.

## What’s in the prototype

- **Landing** (`/`) — program, trust, THB plans, FAQ
- **Join** (`/join`) — three-step flow: plan, Guardian details, payment method, then `/join/success`
- **Success** (`/join/success`) — member ID and next steps
- **Manage** (`/manage`) — plan, impact, receipts, pause/cancel, empty/loading/error states
- **Backoffice** (`/admin`) — ops console. Dashboard through Booth Monitor share one mock book. **Website Content** (`/admin/content`) edits landing copy in localStorage. Reports and Audit Log remain placeholders.

Plans: **WDT 199**, **WDT 399** (recommended), **WDT 999**, billed in Thai baht.

## Run locally

```bash
npm install
npm run dev
```

The dev server binds to **port 43127** (`0.0.0.0`). Open [http://localhost:43127](http://localhost:43127).

```bash
npm run build
npm run start
npm run lint
```

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS with WDT brand colors (`#E27A2F`, `#C1611F`, `#1B1A18`, `#FAF9F6`, `#2F4858`)
- Google Fonts via `next/font`: Archivo (headings) and Inter (body)
- shadcn/ui primitives
