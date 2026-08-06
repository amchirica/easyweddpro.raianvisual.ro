# EasyWedd Pro

Business OS pentru furnizorii din industria evenimentelor — leaduri, oferte,
contracte, plăți, calendar, proiecte, echipă și portal de client, într-un
singur produs. Compatibil excelent cu foto-video, dar relevant pentru
planners, locații, DJ, decor, beauty, catering și agenții.

Construit cu **Next.js 16** (App Router, Turbopack), **React 19**,
**Tailwind CSS v4**, **Base UI**, **Supabase** (auth + Postgres) și deploy pe
**Cloudflare Workers** prin **OpenNext**.

## Cuprins

- [Rulare locală](#rulare-locală)
- [Variabile de mediu](#variabile-de-mediu)
- [Mod demo vs. mod conectat](#mod-demo-vs-mod-conectat)
- [Ce funcționează vs. ce este demonstrativ](#ce-funcționează-vs-ce-este-demonstrativ)
- [Structura proiectului](#structura-proiectului)
- [Scripturi disponibile](#scripturi-disponibile)
- [Deploy pe Cloudflare (OpenNext)](#deploy-pe-cloudflare-opennext)

## Rulare locală

```bash
# 1. Instalează dependențele (dacă nu sunt deja instalate)
npm install

# 2. Copiază variabilele de mediu
cp .env.example .env.local

# 3. Aplică migrațiile SQL în proiectul Supabase (SQL Editor, în ordine):
#    supabase/migrations/20260805000000_easyweddpro_schema.sql
#    supabase/migrations/20260805120000_crm_mvp_fields.sql
#    Opțional DEV: supabase/seed.dev.sql

# 4. Pornește serverul de dezvoltare (Turbopack)
npm run dev
```

Aplicația pornește pe `http://localhost:3000`. Dacă nu completezi
variabilele Supabase în `.env.local` (și nu ești în production),
aplicația rulează în **mod demo** — vezi secțiunea de mai jos.

## Variabile de mediu

Toate variabilele sunt documentate în [`.env.example`](./.env.example)
(pentru `next dev` / `next build`) și [`.dev.vars.example`](./.dev.vars.example)
(pentru runtime-ul local Cloudflare Worker via `wrangler` / OpenNext
preview — copiază-l ca `.dev.vars`).

| Variabilă | Obligatorie | Descriere |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` | Recomandat | URL-ul canonic al aplicației, folosit pentru metadata, sitemap și redirect-uri de autentificare. |
| `NEXT_PUBLIC_SUPABASE_URL` | Nu | URL-ul proiectului Supabase. Lipsă → mod demo. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Nu | Cheia publică (anon) Supabase. Lipsă → mod demo. |
| `SUPABASE_SERVICE_ROLE_KEY` | Nu | Cheie folosită doar server-side (RPC-uri administrative). |
| `EASYWEDDPRO_DEMO` | Nu | Setează `1` pentru a forța modul demo, indiferent de configurarea Supabase. |
| `STRIPE_*` | Nu | Chei pentru facturare (billing) — momentan neconectate în UI-ul livrat în acest pachet. |
| `RESEND_*` | Nu | Chei pentru email tranzacțional — momentan neconectate. |

## Mod demo vs. mod conectat

Proiectul detectează automat contextul prin `hasSupabaseEnv()` /
`isDemoMode()` (`lib/env.ts`):

- **Fără `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`** →
  paginile de autentificare (`/login`, `/register`, `/forgot-password`,
  `/update-password`) afișează un mesaj de „mod demo” cu link direct către
  `/dashboard`, fără a necesita cont.
- **Cu variabilele Supabase completate** → autentificarea reală este
  activă: `signInWithPassword`, `signUp`, `resetPasswordForEmail`,
  `updateUser`, plus rutele `/auth/confirm` (verify OTP prin `token_hash`)
  și `/auth/callback` (OAuth/PKCE prin `exchangeCodeForSession`).

Middleware-ul (`middleware.ts` → `lib/supabase/middleware.ts`) gestionează
protejarea rutelor `/dashboard`, `/admin` și `/onboarding`, redirect-urile
către onboarding pentru conturi neconfigurate complet, și verificarea
rolului de admin platformă.

## Ce funcționează vs. ce este demonstrativ

Acest pachet de fișiere acoperă **marketing, autentificare, onboarding,
SEO, admin și portalul de client** ca UI complet funcțional din punct de
vedere al fluxului de navigare. Datele de business (leaduri, oferte,
contracte, plăți) provin din `lib/demo/fixtures.ts` și sunt **date
demonstrative statice**, nu sunt persistate într-o bază de date reală.

| Zonă | Status |
| --- | --- |
| Landing, `/features`, `/pricing`, SEO (`robots.ts`, `sitemap.ts`) | ✅ Funcțional, conținut real |
| Autentificare (`/login`, `/register`, `/forgot-password`, `/update-password`) | ✅ Funcțional cu Supabase; UI demo dacă Supabase nu este configurat |
| `/auth/confirm`, `/auth/callback` | ✅ Funcțional cu Supabase configurat |
| Onboarding (`/onboarding`) | ⚙️ Wizard funcțional cu stare locală — **nu salvează încă în Supabase**; la final → `/dashboard` |
| Dashboard shell (sidebar, topbar, navigare) | ✅ Funcțional |
| Leaduri (tabel / kanban / listă, filtre) | 🧪 UI complet pe fixtures locale (`lib/demo/fixtures.ts`) |
| Clienți, oferte, contracte, calendar, proiecte, task-uri, plăți | 🧪 UI + date demo Studio Raian Fine Arts |
| Automatizări, template-uri, echipă, analytics, setări | 🧪 UI demonstrativ |
| Ofertă publică (`/p/[token]`) | 🧪 Demonstrativ — `DEMO_PROPOSALS` |
| Portal client (`/portal/[token]`) | 🧪 Demonstrativ |
| Admin platformă (`/admin/*`) | 🧪 Demonstrativ |
| Schema Supabase + RLS | ✅ SQL livrat în `supabase/migrations/` — trebuie aplicat în proiectul Supabase |
| Stripe checkout / Resend email / WhatsApp | ❌ Neactivate — doar pregătire (env + catalog planuri) |

## Structura proiectului

```
app/
  layout.tsx                 Root layout (fonturi, metadata, tema dark)
  robots.ts / sitemap.ts     SEO
  icon.tsx                   Favicon generat (ImageResponse)
  (marketing)/                Landing, /features, /pricing
  (auth)/                     /login, /register, /forgot-password, /check-email, /update-password
  auth/confirm, auth/callback  Route handlers Supabase
  onboarding/                  Wizard de configurare cont
  p/[token]/                   Ofertă publică
  portal/[token]/               Portal client
  dashboard/                    Business OS (leads, clients, CRM modules)
  admin/                        Shell + pagini admin platformă
  privacy/, terms/              Pagini legale
components/
  marketing/, auth/, onboarding/, leads/, dashboard/, brand/, ui/, shared/
lib/
  constants.ts, env.ts, format.ts, url.ts, utils.ts
  auth/, billing/, demo/, supabase/, validations/
supabase/
  migrations/                   Schema multi-tenant + RLS
  seed.dev.sql                  Seed demo (DEV ONLY)
```

## Scripturi disponibile

```bash
npm run dev           # next dev --turbopack
npm run build         # next build --webpack (folosit intern de OpenNext)
npm run start         # next start
npm run lint          # eslint .
npm run typecheck     # tsc --noEmit
npm run cf:build      # opennextjs-cloudflare build → .open-next/
npm run cf:preview    # preview pe runtime Workers (după cf:build)
npm run cf:deploy     # opennextjs-cloudflare deploy (necesită .open-next)
npm run deploy        # cf:build + cf:deploy (all-in-one)
npm run preview       # build + preview
```

## Deploy pe Cloudflare (OpenNext)

Detalii: [`docs/CLOUDFLARE_WORKERS_BUILD.md`](docs/CLOUDFLARE_WORKERS_BUILD.md).

### Workers Builds (dashboard) — obligatoriu

| Setting | Value |
| --- | --- |
| Build command | `npm run cf:build` |
| Deploy command | `npm run cf:deploy` |
| Node.js | `22` |

Nu pune OpenNext în scriptul `build` (buclă infinită).  
Nu folosi Deploy = `npx wrangler deploy` fără Build OpenNext.

### Local CLI

1. Variabile în **Cloudflare Worker Variables**
2. `wrangler login`
3. `npm run deploy`

```bash
cp .dev.vars.example .dev.vars
npm run preview
```

`wrangler.jsonc`: binding-uri `ASSETS`, `WORKER_SELF_REFERENCE`, cron pe `worker.ts`.
