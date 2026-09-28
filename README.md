# Valheim Status

A Vue status dashboard hosted on Cloudflare Pages. The browser calls a same-origin Pages Function, which reads the status JSON through a Cloudflare Tunnel. No Express server or browser CORS configuration is needed.

## Local development

Copy `.env.example` to `.env`, then set `VALHEIM_STATUS_URL` to the status JSON endpoint. Vite proxies `/api/valheim/status` to that URL while developing.

```sh
npm install
npm run dev
```

## Cloudflare Pages

Build with `npm run build` and set the Pages output directory to `dist`. Pages automatically deploys the function at `functions/api/valheim/status.js` as `GET /api/valheim/status`.

Set `VALHEIM_STATUS_URL` in the Pages environment to the Tunnel URL, for example `https://valheim-status.example.com/status.json`. If the Tunnel hostname is protected by Cloudflare Access, also set `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` as encrypted Pages secrets. These values are server-side and are not included in the Vue bundle.

The function uses a 10-second edge cache; the page refreshes every 30 seconds. Keep the status service bound to localhost on the Valheim host and expose it through the Tunnel rather than router port forwarding.
