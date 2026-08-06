# Cloudflare production checklist

Worker name: `easyweddpro-raianvisual` (`wrangler.jsonc`).

## Build & deploy

1. `npm run typecheck && npm run test && npm run lint`
2. `npm run cf:build`
3. `npm run cf:deploy` (or OpenNext deploy pipeline)
4. Confirm `/api/health` and `/api/health/ready` after deploy

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

## Cron

Call hourly or daily:

```http
GET /api/cron/automations
Authorization: Bearer ${CRON_SECRET}
```

Options: Cloudflare Cron Trigger → Worker `scheduled` handler that `fetch`es the route, GitHub Actions, or external cron. Without `CRON_SECRET`, the route returns 401.

## Observability

- Wrangler `observability.enabled: true` is on
- Watch Worker logs for 5xx on `/api/stripe/webhook` and `/api/cron/automations`
- Keep Sentry (or equivalent) as a follow-up; do not log tokens, webhook secrets, or raw PII

## Assets / caching

- Static assets from OpenNext `ASSETS` binding
- Prefer CDN cache for `/_next/static/*`; keep HTML/API dynamic
- PWA `sw.js` should not cache authenticated dashboard HTML aggressively
