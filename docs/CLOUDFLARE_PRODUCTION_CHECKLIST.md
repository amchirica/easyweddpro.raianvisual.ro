# Cloudflare production checklist

Worker name: `easyweddpro-raianvisual` (`wrangler.jsonc`).

## Build & deploy

**Important:** nu folosi `npm run build` + `npx wrangler deploy` — lipsește `.open-next` și apare  
`Could not find compiled Open Next config`. Vezi `docs/CLOUDFLARE_WORKERS_BUILD.md`.

### Local / CLI

1. `npm run typecheck && npm run test && npm run lint`
2. `npm run cf:build` — verifică existența `.open-next/worker.js`
3. `npm run cf:deploy` (sau `npm run deploy` = build + deploy OpenNext)
4. Confirm `/api/health` and `/api/health/ready` after deploy

### Cloudflare Workers Builds (dashboard)

| Setting | Value |
| --- | --- |
| Build command | `npm run cf:build` |
| Deploy command | `npm run cf:deploy` |
| Node.js | `22` |

`build` trebuie să rămână `next build` (OpenNext îl apelează). Nu pune OpenNext în `build`.

## Secrets / vars (Worker)

Set as encrypted secrets (never commit):

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable) | Browser + SSR anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout UI |
| `CRON_SECRET` | Bearer for `/api/cron/automations` |
| Price IDs (`STRIPE_PRICE_*`) | Plan catalog mapping |

## Cron (native Cloudflare)

`wrangler.jsonc` schedules hourly:

```json
"triggers": { "crons": ["0 * * * *"] }
```

Entry: custom `worker.ts` (OpenNext fetch + `scheduled()`).

```
Cloudflare Cron → scheduled() → runBackgroundJobs() → job modules
```

HTTP fallback (optional): `GET/POST /api/cron/automations` with `Authorization: Bearer ${CRON_SECRET}`.

Local test after `cf:build`:

```bash
npx wrangler dev --test-scheduled --config wrangler.jsonc
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

Cron is only considered live after deploy with `worker.ts` as `main` and a successful `scheduled` execution writing to `cron_runs`.

## Observability

- Wrangler `observability.enabled: true` is on
- Watch Worker logs for 5xx on `/api/stripe/webhook` and `/api/cron/automations`
- Keep Sentry (or equivalent) as a follow-up; do not log tokens, webhook secrets, or raw PII

## Assets / caching

- Static assets from OpenNext `ASSETS` binding
- Prefer CDN cache for `/_next/static/*`; keep HTML/API dynamic
- PWA `sw.js` should not cache authenticated dashboard HTML aggressively
