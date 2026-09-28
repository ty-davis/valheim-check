import dotenv from 'dotenv'
import express from 'express'
import { GameDig } from 'gamedig'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

dotenv.config()

const app = express()
const host = process.env.VALHEIM_HOST || '127.0.0.1'
const gamePort = Number(process.env.VALHEIM_PORT || 2456)
const apiPort = Number(process.env.API_PORT || 3001)
const distPath = fileURLToPath(new URL('../dist/', import.meta.url))

app.get('/api/status', async (_request, response) => {
  const target = `${host}:${gamePort}`

  try {
    const server = await GameDig.query({
      type: 'valheim',
      host,
      port: gamePort,
      socketTimeout: 2500,
      attemptTimeout: 8000,
      maxRetries: 0,
      requestRules: true,
    })

    response.json({
      ...server,
      target,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    response.status(503).json({
      error: error instanceof Error ? error.message : 'GameDig could not query this server.',
      target,
      checkedAt: new Date().toISOString(),
    })
  }
})

if (existsSync(distPath)) {
  app.use(express.static(distPath))
}

app.listen(apiPort, '0.0.0.0', () => {
  console.log(`Valheim status API listening on http://localhost:${apiPort}`)
})
