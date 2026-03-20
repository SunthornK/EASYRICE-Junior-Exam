import { Router } from 'express'
import { getStandards } from '../services/standardService'

export const standardRouter = Router()

standardRouter.get('/', (_req, res) => {
  try {
    res.json(getStandards())
  } catch {
    res.status(500).json({ error: 'Standards not available' })
  }
})
