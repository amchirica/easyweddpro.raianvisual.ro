# Contracts MVP — EasyWedd Pro

Flux implementat:

```txt
ofertă acceptată → contract draft → editare → publicare → link public
→ acceptare digitală → PDF → portal client
```

## Migrații

1. `supabase/migrations/20260805160000_contracts_portal.sql`
2. `supabase/migrations/20260805170000_fix_contract_token_hash.sql` — obligatoriu pe proiectele unde `160000` a fost aplicat deja (repară `hash_token` / `digest` pe schema `extensions`)

Nu modifică migrațiile anterioare CRM/proposals.

## Statusuri

`draft | published | viewed | accepted | expired | cancelled | superseded`

Helper: `lib/contracts/status.ts` → `getEffectiveContractStatus()`.

Reguli: doar `draft` se editează liber; `accepted` nu expiră automat; `superseded` după publicarea versiunii noi.

## Numerotare

RPC `next_contract_number(workspace_id)` → `CTR-YYYY-NNNN` via `workspace_counters` (fără `count(*)+1`).

## Token public

- Generare: `crypto.randomBytes(32)` base64url
- DB: `public_token_hash` = SHA-256 (lookup public)
- `public_token` brut este păstrat pentru copy-link intern (RLS member-only)
- RPC public caută **doar după hash**
- Limitare: stocarea brută pentru staff copy-link este o concesie operațională; tokenul nu este logat în activity metadata

## Snapshot & hash

La publicare: snapshot complet + `contract_content_hash` (SHA-256, serializare deterministă).

La acceptare: se salvează hash-ul documentului în `acceptance`.

## Versiuni

`createContractVersionAction` → draft nou, `version++`, `previous_contract_id`.
La publicarea noii versiuni, vechiul contract → `superseded`.

## PDF

Generator: `pdf-lib` + `@pdf-lib/fontkit` + Noto Sans (fără Chromium).

- Node: citește `lib/contracts/fonts/*.ttf`
- Worker: fallback `fetch(origin/fonts/...)` din `public/fonts`
- Compatibilitate țintă: Cloudflare Workers cu `nodejs_compat`
- Fallback HTML printabil: `buildContractPrintHtml`

## Portal

Tabel `client_portal_tokens` (token_hash, expires, revoked).
RPC `get_client_portal_by_token` — acces izolat per client.

## Acceptare digitală

Nu este semnătură electronică calificată. Colectează: nume, email, checkbox-uri, timestamp, IP, user-agent, hash document, versiune.

## Limitări juridice

Vezi `docs/CONTRACTS_LEGAL_GDPR.md`. Politica finală trebuie verificată juridic.
