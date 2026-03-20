import express from 'express'
import cors from 'cors'
import { initDb } from './db/schema'
import { loadStandards } from './services/standardService'
import { standardRouter } from './routes/standard'
import { historyRouter } from './routes/history'

export function createApp() {
  const app = express()
  app.use(cors({ origin: 'http://localhost:5173' }))
  app.use(express.json({ limit: '10mb' }))
  app.use('/standard', standardRouter)
  app.use('/history', historyRouter)
  return app
}

async function start() {
  initDb()
  await loadStandards()
  const app = createApp()
  const port = process.env.PORT ?? 3000
  app.listen(port, () => console.log(`Backend running on port ${port}`))
}

start().catch(console.error)
