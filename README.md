# Raven / Watch

A compact Vue status board for a Valheim dedicated server. GameDig runs in the Node API because server queries use UDP and cannot be made from a browser.

## Configure

Copy `.env.example` to `.env`, then set the public hostname or IP and game port for your server. The default game port is `2456`; GameDig handles Valheim's query-port offset.

```sh
npm install
npm run dev
```

The Vite page runs at `http://localhost:5173` and polls the API every 30 seconds. The API can also be run by itself with `npm start`; after `npm run build` it serves the production page and `/api/status` on port `3001` by default. Override `API_PORT` if needed.
