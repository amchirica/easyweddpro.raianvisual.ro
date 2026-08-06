# Cloudflare Workers Builds — EasyWedd Pro

## Cauza erorii „Could not find compiled Open Next config”

Log tipic greșit:

```txt
Executing user build command: npm run build   → doar Next (.next), fără .open-next
Executing user deploy command: npx wrangler deploy
OpenNext project detected, calling opennextjs-cloudflare deploy
ERROR Could not find compiled Open Next config
```

Deploy-ul OpenNext cere artefacte din `opennextjs-cloudflare build` (folder `.open-next/`).

## Setări obligatorii în Workers Builds

| Setting | Value (recomandat) | Compatibil cu setările vechi |
| --- | --- | --- |
| **Build command** | `npm run cf:build` | `npm run build` *(acum = OpenNext)* |
| **Deploy command** | `npm run cf:deploy` | `npx opennextjs-cloudflare deploy` |
| **Node.js version** | `22` | `22` |

Preferat explicit:

```txt
Build command:  npm run cf:build
Deploy command: npm run cf:deploy
```

Dacă lași Build = `npm run build`, după update-ul din `package.json` acesta rulează deja OpenNext și produce `.open-next`. Deploy-ul trebuie totuși să fie OpenNext (`npm run cf:deploy` sau `npx opennextjs-cloudflare deploy`), nu un `wrangler deploy` fără artefacte.

## Scripturi

| Script | Efect |
| --- | --- |
| `npm run build` | **OpenNext** → `.open-next/` (Cloudflare Workers Builds) |
| `npm run build:next` | Doar `next build --webpack` (local / CI fără Workers) |
| `npm run cf:build` | Alias OpenNext build |
| `npm run cf:deploy` | Deploy OpenNext (necesită `.open-next` din Build) |
| `npm run deploy` | OpenNext build + deploy |

## Node.js

- Local / CI: Node **22** (`engines`: `>=22 <23`, `.nvmrc`: `22`)
- Cloudflare Workers Builds: Node **22**

## Verificare după build

```txt
.open-next/
.open-next/worker.js
```

`.open-next` și `.next` sunt în `.gitignore`.

### Windows `EBUSY` pe `.open-next/assets`

Oprește `workerd` / preview, șterge `.open-next`, reîncearcă. Preferă build pe Cloudflare (Linux) sau WSL.

## Variabile / secrete

Vezi `docs/CLOUDFLARE_PRODUCTION_CHECKLIST.md` și `docs/AUTH_CONFIGURATION.md`.

## Health după deploy

```txt
https://<worker-host>/api/health
https://<worker-host>/api/health/ready
```

## Middleware vs proxy

Proiectul păstrează `middleware.ts`. Migrarea la `proxy.ts` este amânată (OpenNext pe Workers). Warning-ul Next este acceptat.
