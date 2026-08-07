# Domain & Cloudflare deploy checklist

Worker name (from `wrangler.jsonc`): `easyweddpro-raianvisual-ro`.
Custom domain: `easyweddpro.raianvisual.ro` (`workers_dev` / `preview_urls` disabled).

`NEXT_PUBLIC_APP_URL` alone does **not** make a hostname reachable. Firefox **Server Not Found** means DNS/deploy failed — it is not a Next.js 404.

If the root returns plain-text `Hello world`, the hostname is bound to a Cloudflare starter Worker — not the OpenNext app. Fix by deploying this repo to `easyweddpro-raianvisual-ro` and ensuring the custom domain is on that Worker only.

## Steps (production)

1. **Cloudflare DNS** for `raianvisual.ro`
   - Confirm zone is active
   - Plan a record for `easyweddpro` (CNAME/AAAA as required by Workers custom domains)

2. **Workers & Pages**
   - Open the Worker `easyweddpro-raianvisual-ro` (OpenNext deploy target from `wrangler.jsonc`)
   - Remove or leave unused any demo/starter Worker that previously owned the hostname

3. **Worker custom domains**
   - Workers → `easyweddpro-raianvisual-ro` → Settings → Domains & Routes
   - Custom domain (also declared in `wrangler.jsonc` `routes`):

   ```txt
   easyweddpro.raianvisual.ro
   ```

4. **DNS verification**
   - Wait until Cloudflare shows the domain as Active
   - `nslookup easyweddpro.raianvisual.ro` (or dig) returns Cloudflare addresses

5. **SSL certificate**
   - Custom domain status Active implies certificate issued
   - Browser must show a valid HTTPS lock for the host

6. **Deploy Worker**

   ```bash
   npm run cf:build   # prefer WSL/CI on Windows if EBUSY on .open-next/assets
   npm run cf:deploy  # OpenNext deploy — do not use raw `wrangler deploy` for the app
   ```


7. **Health check**

   ```txt
   https://easyweddpro.raianvisual.ro/api/health
   ```

   Must return success before any auth email testing against production.

8. **Then** configure Supabase Site URL + Redirect URLs for production (see `docs/AUTH_CONFIGURATION.md`).

## Staging (optional)

Repeat the same flow for:

```txt
staging-easyweddpro.raianvisual.ro
```

Set Worker vars `NEXT_PUBLIC_APP_URL` to the staging origin.

## Local

- `npm run dev` on `http://localhost:3000`
- Supabase redirect URLs must include localhost
- Never point local `NEXT_PUBLIC_APP_URL` at production

## Related

- `docs/CLOUDFLARE_PRODUCTION_CHECKLIST.md` — secrets, cron, observability
- `docs/AUTH_CONFIGURATION.md` — Supabase redirect URLs
