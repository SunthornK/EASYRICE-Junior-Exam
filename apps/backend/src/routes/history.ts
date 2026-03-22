import { Router, Request, Response } from 'express'
import { nanoid } from 'nanoid'
import { calculate } from '../services/inspectionService'
import { getStandardById } from '../services/standardService'
import {
  insertInspection, findInspectionById,
  findAllInspections, updateInspection, deleteInspections
} from '../db/historyRepo'
import type { CreateInspectionPayload, UpdateInspectionPayload, RawGrain } from '@easyrice/shared'

export const historyRouter = Router()

historyRouter.get('/', (req: Request, res: Response) => {
  const { inspectionId, fromDate, toDate } = req.query as Record<string, string | undefined>
  res.json(findAllInspections({ inspectionId, fromDate, toDate }))
})

historyRouter.get('/:id', (req: Request, res: Response) => {
  const inspection = findInspectionById(req.params.id)
  if (!inspection) return res.status(404).json({ error: 'Not found' })
  res.json(inspection)
})

historyRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body as CreateInspectionPayload
  if (!body.name?.trim()) return res.status(400).json({ error: 'name is required' })
  if (!body.standardId?.trim()) return res.status(400).json({ error: 'standardId is required' })

  const standard = getStandardById(body.standardId)
  if (!standard) return res.status(400).json({ error: 'Standard not found' })

  let grains: RawGrain[]
  let imageURL: string | undefined = body.imageURL

  if (body.rawData) {
    grains = body.rawData
  } else {
    const url = process.env.RAW_JSON_URL
    if (!url) return res.status(500).json({ error: 'RAW_JSON_URL not configured' })
    const fetchRes = await fetch(url)
    if (!fetchRes.ok) return res.status(502).json({ error: 'Failed to fetch raw grain data' })
    const rawJson = await fetchRes.json() as { grains?: RawGrain[]; imageURL?: string } | RawGrain[]
    grains = Array.isArray(rawJson) ? rawJson : (rawJson.grains ?? [])
    if (!Array.isArray(rawJson) && rawJson.imageURL) imageURL = rawJson.imageURL
  }

  const { composition, defects, totalSample } = calculate(grains, standard)
  const now = new Date().toISOString()
  const inspection = {
    id: nanoid(), name: body.name,
    standardId: body.standardId, standardName: standard.name,
    imageURL,
    note: body.note, price: body.price,
    samplingPoint: body.samplingPoint, samplingDate: body.samplingDate,
    totalSample, composition, defects, createdAt: now, updatedAt: now,
  }

  insertInspection(inspection)
  res.status(201).json(inspection)
})

historyRouter.put('/:id', (req: Request, res: Response) => {
  if (!findInspectionById(req.params.id)) return res.status(404).json({ error: 'Not found' })
  const updated = updateInspection(req.params.id, req.body as UpdateInspectionPayload)
  res.json(updated)
})

historyRouter.delete('/', (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] }
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids must be a non-empty array' })
  deleteInspections(ids)
  res.status(204).send()
})
