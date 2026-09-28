# Raven / Watch

A compact Vue status board for a Valheim dedicated server, backed by an HTTP JSON status feed.

## Configure

Copy `.env.example` to `.env` and set `STATUS_BASE_URL` to the status service origin. The API appends `/status.json` and proxies the request so the browser does not depend on the upstream service's CORS settings.

```sh
npm install
npm run dev
```

The Vite page runs at `http://localhost:5173` and polls the API every 30 seconds. The Node API can also be run by itself with `npm start`; after `npm run build` it serves the production page and `/api/status` on port `3001` by default. Override `API_PORT` if needed.
