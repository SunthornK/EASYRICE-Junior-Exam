import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../index'
import { initDb } from '../db/schema'
import { setStandardsForTesting } from '../services/standardService'
import type { Standard } from '@easyrice/shared'

const std: Standard = {
  id: 'std-test', name: 'Test Standard', createDate: '2024-01-01',
  standardData: [{
    key: 'whole', name: 'ข้าวเต็มเมล็ด',
    minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE',
    shape: ['wholegrain'],
  }],
}
const grains = [
  { length: 7.0, weight: 0.02, shape: 'wholegrain', type: 'white' },
  { length: 8.0, weight: 0.03, shape: 'wholegrain', type: 'yellow' },
]

beforeEach(() => {
  initDb(':memory:')
  setStandardsForTesting([std])
})

describe('GET /standard', () => {
  it('returns standards list', async () => {
    const res = await request(createApp()).get('/standard')
    expect(res.status).toBe(200)
    expect(res.body[0].id).toBe('std-test')
  })
})

describe('POST /history', () => {
  it('creates inspection and returns 201', async () => {
    const res = await request(createApp()).post('/history').send({ name: 'A', standardId: 'std-test', rawData: grains })
    expect(res.status).toBe(201)
    expect(res.body.totalSample).toBe(2)
    expect(res.body.composition).toHaveLength(1)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(createApp()).post('/history').send({ standardId: 'std-test', rawData: grains })
    expect(res.status).toBe(400)
  })

  it('returns 400 when standard not found', async () => {
    const res = await request(createApp()).post('/history').send({ name: 'A', standardId: 'bad', rawData: grains })
    expect(res.status).toBe(400)
  })
})

describe('GET /history/:id', () => {
  it('returns 404 for unknown id', async () => {
    const res = await request(createApp()).get('/history/nope')
    expect(res.status).toBe(404)
  })

  it('returns inspection after POST', async () => {
    const app = createApp()
    const created = await request(app).post('/history').send({ name: 'B', standardId: 'std-test', rawData: grains })
    const res = await request(app).get(`/history/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(created.body.id)
  })
})

describe('PUT /history/:id', () => {
  it('updates note and reflects in GET', async () => {
    const app = createApp()
    const created = await request(app).post('/history').send({ name: 'C', standardId: 'std-test', rawData: grains })
    const res = await request(app).put(`/history/${created.body.id}`).send({ note: 'new note' })
    expect(res.status).toBe(200)
    expect(res.body.note).toBe('new note')
  })
})

describe('DELETE /history', () => {
  it('removes record and returns 204', async () => {
    const app = createApp()
    const created = await request(app).post('/history').send({ name: 'D', standardId: 'std-test', rawData: grains })
    const del = await request(app).delete('/history').send({ ids: [created.body.id] })
    expect(del.status).toBe(204)
    expect((await request(app).get(`/history/${created.body.id}`)).status).toBe(404)
  })
})
