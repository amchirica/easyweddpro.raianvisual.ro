# Cloudflare Workers Builds — EasyWedd Pro

## Cauza erorii „Could not find compiled Open Next config”

Combinația greșită:

```txt
Build command:  npm run build          → doar next build (.next)
Deploy command: npx wrangler deploy    → caută artefacte OpenNext (.open-next)
```

`npm run build` **nu** generează `.open-next/`. Deploy-ul OpenNext / Wrangler pe proiect OpenNext cere build-ul `opennextjs-cloudflare`.

## Setări recomandate în Workers Builds

| Setting | Value |
| --- | --- |
| **Build command** | `npm run cf:build` |
| **Deploy command** | `npm run cf:deploy` |
| **Root directory** | (repo root) |
| **Node.js version** | `22` (LTS; vezi `engines` + `.nvmrc`) |

Echivalent fără npm scripts:

```txt
Build command:  npx opennextjs-cloudflare build
Deploy command: npx opennextjs-cloudflare deploy
```

### Alternativă (o singură comandă locală / CI simplu)

```txt
Build command:  npm run build
Deploy command: npm run deploy
```

Doar dacă `deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy` (cum e în `package.json`).  
În Workers Builds, preferă **Build = `cf:build`** + **Deploy = `cf:deploy`** ca să nu dublezi build-ul OpenNext inutil în Deploy (Deploy presupune că Build a produs deja `.open-next`).

### Nu folosi

```txt
npm run build
npx wrangler deploy
```

## Scripturi locale

| Script | Efect |
| --- | --- |
| `npm run build` | Next.js only (CI lint/typecheck/local) |
| `npm run cf:build` | OpenNext → `.open-next/` (+ rulează Next build intern) |
| `npm run cf:preview` | Preview pe runtime Workers (după `cf:build`) |
| `npm run cf:deploy` | Deploy OpenNext (necesită `.open-next` existent) |
| `npm run deploy` | `cf:build` + `cf:deploy` (all-in-one) |

## Node.js

- Local / CI: Node **22** (`engines`: `>=22 <23`, `.nvmrc`: `22`)
- În Cloudflare Workers Builds: setează Node version **22** (UI Build → Node.js version, sau var de mediu conform docs Cloudflare)

Nu folosi Node 24 pe build până când OpenNext/Next sunt validate pe 24.

## Verificare după build

După `npm run cf:build` trebuie să existe:

```txt
.open-next/
.open-next/worker.js
```

`.open-next` și `.next` sunt în `.gitignore` — nu se commită.

### Windows `EBUSY` pe `.open-next/assets`

OpenNext pe Windows poate eșua cu:

```txt
Error: EBUSY: resource busy or locked, rmdir '...\.open-next\assets'
```

Cauză tipică: un proces `workerd` (preview/`wrangler dev`) ține folderul deschis.

Mitigare locală:

1. Oprește orice `npm run preview` / `wrangler dev`
2. `Get-Process workerd | Stop-Process -Force`
3. Șterge `.open-next` manual
4. Reîncearcă `npm run cf:build`

Preferabil: rulează `cf:build` / deploy în **Cloudflare Workers Builds** (Linux) sau WSL — acolo nu apare EBUSY.

## Variabile / secrete (Worker)

Vezi `docs/CLOUDFLARE_PRODUCTION_CHECKLIST.md` și `docs/AUTH_CONFIGURATION.md`.

Obligatorii pentru producție:

- `NEXT_PUBLIC_APP_URL` = `https://easyweddpro.raianvisual.ro` (după ce domeniul răspunde)
- `NEXT_PUBLIC_SUPABASE_URL`, anon/publishable key
- `SUPABASE_SERVICE_ROLE_KEY`
- Stripe / Resend / `CRON_SECRET` după nevoie

## Health după deploy

```txt
https://<worker-host>/api/health
https://<worker-host>/api/health/ready
```

Apoi custom domain + Supabase redirect URLs.

## Middleware vs proxy

Proiectul păstrează `middleware.ts`. Migrarea la `proxy.ts` este **amânată**: OpenNext pe Workers tratează proxy ca Node middleware și poate eșua. Warning-ul Next.js „middleware deprecated” este acceptat până la suport stabil.
