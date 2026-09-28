import dotenv from 'dotenv'
import express from 'express'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

dotenv.config()

const app = express()
const statusBaseUrl = process.env.STATUS_BASE_URL || 'https://valstatus.ty-davis.com'
const statusUrl = new URL('/status.json', statusBaseUrl)
const apiPort = Number(process.env.API_PORT || 3001)
const distPath = fileURLToPath(new URL('../dist/', import.meta.url))

app.get('/api/status', async (_request, response) => {
  try {
    const upstream = await fetch(statusUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!upstream.ok) throw new Error(`Status source returned HTTP ${upstream.status}.`)

    const body = await upstream.text()
    // Keep Steam IDs exact; their JSON integer values exceed JavaScript's safe integer range.
    const payload = JSON.parse(body.replace(/("steam_id"\s*:\s*)(\d+)/, '$1"$2"'))
    response.set('Cache-Control', 'no-store')
    response.json(payload)
  } catch (error) {
    response.status(503).json({
      error: error instanceof Error ? error.message : 'Could not fetch the status source.',
    })
  }
})

if (existsSync(distPath)) {
  app.use(express.static(distPath))
}

app.listen(apiPort, '0.0.0.0', () => {
  console.log(`Valheim status API listening on http://localhost:${apiPort}`)
})
