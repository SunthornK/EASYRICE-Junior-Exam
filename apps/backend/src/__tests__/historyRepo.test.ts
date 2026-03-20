import { describe, it, expect, beforeEach } from 'vitest'
import { initDb } from '../db/schema'
import {
  insertInspection, findInspectionById,
  findAllInspections, updateInspection, deleteInspections
} from '../db/historyRepo'
import type { Inspection } from '@easyrice/shared'

const sample: Inspection = {
  id: 'test-1',
  name: 'Test Batch',
  standardId: 'std-1',
  standardName: 'Standard A',
  note: 'some note',
  price: 100.50,
  samplingPoint: ['Front End'],
  samplingDate: '2026-03-20T10:00:00.000Z',
  totalSample: 5,
  composition: [{
    key: 'k1', name: 'ข้าวเต็มเมล็ด',
    minLength: 6, maxLength: 10,
    conditionMin: 'GE', conditionMax: 'LE',
    actualPercent: 80, actualWeight: 0.08
  }],
  defects: [{ type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 20, actualWeight: 0.02 }],
  createdAt: '2026-03-20T10:00:00.000Z',
  updatedAt: '2026-03-20T10:00:00.000Z',
}

beforeEach(() => { initDb(':memory:') })

describe('insertInspection + findInspectionById', () => {
  it('round-trips a record including JSON fields', () => {
    insertInspection(sample)
    const found = findInspectionById('test-1')
    expect(found).toMatchObject({ id: 'test-1', name: 'Test Batch', totalSample: 5 })
    expect(found?.composition[0].key).toBe('k1')
    expect(found?.samplingPoint).toEqual(['Front End'])
  })
})

describe('findAllInspections', () => {
  it('returns HistoryListItem fields only', () => {
    insertInspection(sample)
    const list = findAllInspections()
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id: 'test-1', standardName: 'Standard A' })
    expect((list[0] as any).composition).toBeUndefined()
  })

  it('filters by partial inspectionId match', () => {
    insertInspection(sample)
    insertInspection({ ...sample, id: 'test-2', name: 'Other' })
    expect(findAllInspections('test-1')).toHaveLength(1)
    expect(findAllInspections('test')).toHaveLength(2)
    expect(findAllInspections('xyz')).toHaveLength(0)
  })
})

describe('updateInspection', () => {
  it('updates note and refreshes updatedAt', () => {
    insertInspection(sample)
    const before = findInspectionById('test-1')!
    updateInspection('test-1', { note: 'updated' })
    const after = findInspectionById('test-1')!
    expect(after.note).toBe('updated')
    expect(after.updatedAt).not.toBe(before.updatedAt)
  })
})

describe('deleteInspections', () => {
  it('removes specified records', () => {
    insertInspection(sample)
    insertInspection({ ...sample, id: 'test-2', name: 'Other' })
    deleteInspections(['test-1'])
    expect(findAllInspections()).toHaveLength(1)
    expect(findInspectionById('test-1')).toBeUndefined()
  })
})
