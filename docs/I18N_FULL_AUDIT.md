# I18N Full Audit — EasyWedd Pro

Generated: 2026-08-08T07:28:30.334Z

## Verdict

- User-facing RO leftovers (excluding intentional markers/samples): **0**
- Intentional non-UI leftovers: **8**
- RO↔EN key parity: missing in EN **0**, missing in RO **0**
- Lines already using `t()` / `getTranslator`: **2181**

## Classification counts

| Category | Count |
|---|---|
| translated | 2181 |
| intentionally-english | 34 |
| technical | 8 |
| user-generated (heuristic) | 0 |
| intentional-remaining | 8 |
| remaining | 0 |

## Intentionally English glossary

EasyWedd Pro, Business OS, CRM, Lead / Leaduri, Pipeline, Workflow, Follow-up, Template, Analytics, Feature Flags, Webhook, Cron, API, AI, Storage, Stripe, Supabase, Cloudflare. Product term **Dashboard** may remain in RO nav/titles.

## Intentional remaining (not UI copy)

- `components/leads/lead-form-dialog.tsx:80` — `const guestMatch = notes.match(/^Invitați:\s*(.+)$/m);`
- `components/leads/lead-form-dialog.tsx:81` — `const durationMatch = notes.match(/^Durată:\s*(.+)$/m);`
- `components/leads/lead-form-dialog.tsx:83` — `.replace(/^Invitați:\s*.+$/m, "")`
- `components/leads/lead-form-dialog.tsx:84` — `.replace(/^Durată:\s*.+$/m, "")`
- `components/leads/lead-form-dialog.tsx:96` — `if (form.guestCount.trim()) parts.push('Invitați: ${form.guestCount.trim()}');`
- `components/leads/lead-form-dialog.tsx:97` — `if (form.duration.trim()) parts.push('Durată: ${form.duration.trim()}');`
- `components/onboarding/onboarding-wizard.tsx:112` — `country: "România",`
- `components/templates/template-preview.tsx:15` — `event_location: "Sala Regală, București",`

## Remaining user-facing RO

_None — acceptance criterion met for scanned surfaces._

## Message namespaces

- `admin`
- `assistant`
- `auth`
- `billing`
- `common`
- `dashboard`
- `marketing`
- `modules`
- `nav`
- `portal`
- `search`
- `settings`
- `status`
- `theme`
- `toasts`
- `validation`

## Parity gaps

_RO and EN keys are in full parity._

## Acceptance pages (RO + EN)

- `/dashboard`
- `/dashboard/settings`
- `/dashboard/proposals`
- `/dashboard/contracts`
- `/dashboard/leads`
- `/dashboard/clients`
- `/dashboard/payments`
- `/dashboard/projects`
- `/dashboard/tasks`
- `/dashboard/calendar`
- `/dashboard/analytics`
- `/admin/*`

Soft locale switch: cookie `ewp_locale` + `setLocale` + `router.refresh()`. Client surfaces use `useI18n()`; SSR uses `getTranslator()`.

## How to re-run

```bash
npm run i18n:audit:full
```

## Soft locale switch

Cookie `ewp_locale` + client `setLocale` + `router.refresh()` so SSR/`getTranslator()` pages catch up without a hard reload. Theme is unchanged.

## Verification notes (2026-08-08)

| Check | Result |
|---|---|
| lint | pass (0 errors; unused-import warnings) |
| typecheck | pass |
| test | pass (261) |
| build | pass |
| cf:build | blocked on this Windows machine: (1) `EBUSY` on repo `.open-next/assets` while a leftover `workerd` holds the folder; (2) in a clean temp copy, Next build succeeded but OpenNext bundling failed with `EPERM` creating `node_modules` symlinks (needs Windows Developer Mode / admin). Close preview processes, delete `.open-next`, enable Developer Mode, then re-run `npm run cf:build`. |
