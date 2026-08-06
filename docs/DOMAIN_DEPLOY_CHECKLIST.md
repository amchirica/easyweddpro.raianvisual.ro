# Domain & Cloudflare deploy checklist

Worker name (from `wrangler.jsonc`): `easyweddpro-raianvisual`.

`NEXT_PUBLIC_APP_URL` alone does **not** make a hostname reachable. Firefox **Server Not Found** means DNS/deploy failed — it is not a Next.js 404.

## Steps (production)

1. **Cloudflare DNS** for `raianvisual.ro`
   - Confirm zone is active
   - Plan a record for `easyweddpro` (CNAME/AAAA as required by Workers custom domains)

2. **Workers & Pages**
   - Open the Worker `easyweddpro-raianvisual` (or the OpenNext deploy target)

3. **Worker custom domains**
   - Workers → your worker → Settings → Domains & Routes
   - Add custom domain:

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
   npx wrangler deploy --config wrangler.jsonc
   ```

   Or `npm run cf:deploy`.

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
