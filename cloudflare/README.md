# Deploying Seek First

`../web` is uploaded as Cloudflare static assets and served at
**https://seekfirst.jackmertens.com**. There is no Worker code, no database, and no
secrets — the app runs entirely in the browser and stores everything on the device.

## First deploy

```sh
cd cloudflare
npm install
npx wrangler login            # opens a browser once
npm run deploy
```

That creates the `seek-first` Worker, uploads `web/`, and — because `wrangler.jsonc`
declares `routes[].custom_domain` — adds the DNS record for `seekfirst.jackmertens.com`
in the `jackmertens.com` zone. The zone must already be on the same Cloudflare account.

On a machine with no browser, create an API token instead
(https://dash.cloudflare.com/profile/api-tokens → Create Custom Token) with:

| Scope | Permission |
|---|---|
| Account · Workers Scripts | Edit |
| Account · Account Settings | Read |
| Zone · Workers Routes (jackmertens.com) | Edit |
| Zone · DNS (jackmertens.com) | Edit |

then `export CLOUDFLARE_API_TOKEN=…` and `npm run deploy`.

## Later deploys

`npm run deploy` again — only changed files upload. The service worker picks up the new
page on the next launch; `index.html` and `sw.js` are served `no-cache` so an update is
never more than one refresh away.

## Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It launches full-screen
with the crown icon, keeps its own storage, and works offline once opened.
(Safari is required for installing — Chrome on iOS cannot add PWAs to the home screen.)

## Costs

Static assets on the Workers free plan: no charge at this traffic. No database, no
egress fees, no API keys to rotate.
