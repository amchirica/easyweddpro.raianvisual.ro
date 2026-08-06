# Auth configuration (Supabase)

Configure **Authentication → URL Configuration** in the Supabase project that matches the environment you are testing. Domains must resolve and serve the app **before** you point redirect URLs at them.

## Development

**Site URL**

```txt
http://localhost:3000
```

**Redirect URLs**

```txt
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/auth/reset-password
```

Local `.env.local` must use `NEXT_PUBLIC_APP_URL=http://localhost:3000` only. Do not leave a second production override in the same file (the last value wins and breaks local email redirects).

## Staging

**Site URL**

```txt
https://staging-easyweddpro.raianvisual.ro
```

**Redirect URLs**

```txt
https://staging-easyweddpro.raianvisual.ro/auth/callback
https://staging-easyweddpro.raianvisual.ro/auth/confirm
https://staging-easyweddpro.raianvisual.ro/auth/reset-password
```

## Production

Only after `https://easyweddpro.raianvisual.ro/api/health` responds:

**Site URL**

```txt
https://easyweddpro.raianvisual.ro
```

**Redirect URLs**

```txt
https://easyweddpro.raianvisual.ro/auth/callback
https://easyweddpro.raianvisual.ro/auth/confirm
https://easyweddpro.raianvisual.ro/auth/reset-password
```

## App helpers

| Helper | Role |
| --- | --- |
| `getAppUrl()` | Absolute origin for email `redirectTo` / `emailRedirectTo` |
| `redirectRelative(request, path)` | Post-auth redirects that keep the current host |
| `getSafeRedirectPath()` | Open-redirect protection for `next` |

Signup confirmation email:

```txt
${getAppUrl()}/auth/confirm?next=/onboarding
```

Password recovery email:

```txt
${getAppUrl()}/auth/callback?next=/auth/reset-password
```

After `verifyOtp` / `exchangeCodeForSession`, the app redirects with **relative** paths (`/onboarding`, `/dashboard`, `/auth/reset-password`) based on `request.url`, so localhost stays on localhost even if a mis-set env var exists (and development warns if `NEXT_PUBLIC_APP_URL` points at production).

## Email templates (Supabase)

Prefer links that hit `/auth/confirm` with `token_hash` + `type`, or PKCE links that hit `/auth/callback` with `code`. Recovery should land on `/auth/reset-password` after session exchange.
