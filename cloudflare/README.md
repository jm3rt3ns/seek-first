# Seek First on Cloudflare

One Worker serves the app (`../web` as static assets) and a small JSON API backed by D1.
Sign-in is Google (OAuth 2.0 authorization code + PKCE, handled server-side), sessions are
HttpOnly cookies, and the prayer-note parser calls the Claude API with a key that never
leaves the Worker.

```
Browser ──(HTTPS)──► Worker ──► static assets (web/)
                       │
                       ├──► D1: users · sessions · state · journal · usage
                       ├──► accounts.google.com / oauth2.googleapis.com  (sign-in)
                       └──► api.anthropic.com                          (prayer parser)
```

## One-time setup

1. **Google OAuth client** — Google Cloud Console → APIs & Services → Credentials →
   *Create credentials → OAuth client ID → Web application*.
   - Authorized JavaScript origin: `https://<your-domain>`
   - Authorized redirect URI: `https://<your-domain>/api/auth/callback`
   - Keep the client ID and secret.
2. **D1 database**
   ```sh
   cd cloudflare
   npm install
   npx wrangler login
   npx wrangler d1 create seek-first        # paste the database_id into wrangler.jsonc
   npm run db:migrate                       # applies migrations/ to the remote DB
   ```
3. **Config** — in `wrangler.jsonc` set `GOOGLE_CLIENT_ID` and `APP_ORIGIN` (the exact
   origin users will visit, e.g. `https://seekfirst.example.com`; no trailing slash).
4. **Secrets**
   ```sh
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put ANTHROPIC_API_KEY     # console.anthropic.com → API keys
   ```
5. **Deploy**
   ```sh
   npm run deploy
   ```
   Then attach the custom domain: Cloudflare dashboard → Workers & Pages → seek-first →
   Settings → Domains & Routes → *Add custom domain*. `APP_ORIGIN` must match it.

## Day to day

- `npm run typecheck` / `npm test` — type-check the Worker and run the unit tests
  (Google token verification against a generated key, cookies, parser normalization).
- `npm run dev` — local dev server (uses a local D1; run `npm run db:migrate:local` first).
  Google sign-in needs `APP_ORIGIN=http://localhost:8787` and that origin/redirect on the
  OAuth client, or use "Continue without an account" locally.
- `npm run deploy` — ship. Static assets and the Worker deploy together.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/auth/login` | Redirects to Google. `?return=/path` to come back somewhere specific. |
| GET | `/api/auth/callback` | Google redirects here; sets the session cookie. |
| POST | `/api/auth/logout` | Deletes the session. |
| GET | `/api/me` | `{user: {id,email,name,picture} \| null}` |
| GET / PUT | `/api/state` | The whole app state as JSON (≤ 256 KB). PUT returns 409 with the newer copy if another device wrote later. |
| GET | `/api/journal` | Recent entries. |
| GET / PUT | `/api/journal/YYYY-MM-DD` | One entry (≤ 64 KB). Empty text deletes it. |
| POST | `/api/prayer/parse` | `{text, existing}` → `{actions, reply}`. 150/day per user. |
| DELETE | `/api/account` | Removes the user and everything they stored. |

Every non-GET call must carry `X-Requested-With: SeekFirst` and, when the browser sends one,
an `Origin` equal to `APP_ORIGIN`.

## Security notes

- Session tokens are 256-bit random values; only their SHA-256 is stored. Cookies are
  `HttpOnly; Secure; SameSite=Lax`, 30 days sliding.
- The OAuth `state`, `nonce`, and PKCE verifier live in a 10-minute HttpOnly cookie scoped
  to `/api/auth`; the ID token's signature is verified against Google's JWKS and its
  issuer, audience, expiry, and nonce are checked.
- The page is served with a per-response CSP nonce (`script-src 'nonce-…' cdnjs`), HSTS,
  `frame-ancestors 'none'`, and `nosniff`. All user text is rendered with `textContent`.
- The Claude API key is a Worker secret; the browser only ever calls `/api/prayer/parse`,
  which caps input length and per-user daily calls.
- Users can delete everything with `DELETE /api/account` (exposed under Manage → Account).
