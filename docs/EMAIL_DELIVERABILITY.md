# Email deliverability (Resend)

## Configuration

- `RESEND_API_KEY` — server-only
- `RESEND_FROM_EMAIL` — verified domain sender (e.g. `EasyWedd Pro <noreply@yourdomain.ro>`)
- Optional reply-to via template helpers in `lib/email/`

If Resend is not configured, `sendWorkspaceEmail` records `email_deliveries.status = skipped` and does **not** claim success.

## Domain setup (production)

1. Add domain in Resend
2. Publish SPF + DKIM DNS records
3. Add DMARC (`p=none` → `quarantine` after monitoring)
4. Send a test to Gmail/Outlook; check spam folder

## Idempotency

All transactional sends go through `sendWorkspaceEmail` with a stable `idempotencyKey` (unique on `email_deliveries`). Retries never double-send.

## Templates

Use `lib/email/templates/base.ts` for layout consistency. Prefer short subjects, plain-language Romanian, and a single primary CTA link.

## Support

Query `email_deliveries` by `workspace_id`, `recipient`, or `idempotency_key` when a client reports a missing email.
