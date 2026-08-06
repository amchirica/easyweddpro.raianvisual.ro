# Cloudflare Workers Builds — EasyWedd Pro

## Buclă infinită (important)

**Nu** pune `opennextjs-cloudflare build` în scriptul npm `build`.

OpenNext rulează intern `npm run build` (= Next.js). Dacă `build` pointează tot la OpenNext → recursie infinită (exact ce apare în log: OpenNext → Building Next.js app → `npm run build` → OpenNext… pe loop).

Corect:

```json
{
  "build": "next build --webpack",
  "cf:build": "opennextjs-cloudflare build",
  "cf:deploy": "opennextjs-cloudflare deploy"
}
```

## Cauza „Could not find compiled Open Next config”

```txt
Build:  npm run build          → doar .next
Deploy: npx wrangler deploy    → cere .open-next
```

## Setări obligatorii Workers Builds

| Setting | Value |
| --- | --- |
| **Build command** | `npm run cf:build` |
| **Deploy command** | `npm run cf:deploy` |
| **Node.js** | `22` |

Echivalent:

```txt
Build command:  npx opennextjs-cloudflare build
Deploy command: npx opennextjs-cloudflare deploy
```

**Nu** folosi:

```txt
Build:  npm run build
Deploy: npx wrangler deploy
```

## Scripturi

| Script | Efect |
| --- | --- |
| `npm run build` | Doar Next.js (apelat de OpenNext) |
| `npm run cf:build` | OpenNext → `.open-next/` |
| `npm run cf:deploy` | Deploy OpenNext (după `cf:build`) |
| `npm run deploy` | `cf:build` + `cf:deploy` |

## Verificare

După `cf:build` trebuie să existe `.open-next/worker.js`.

## Node

`engines`: `>=22 <23`, `.nvmrc`: `22`
