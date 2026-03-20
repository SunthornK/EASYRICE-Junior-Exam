import { getDb } from './schema'
import type { Inspection, HistoryListItem, UpdateInspectionPayload } from '@easyrice/shared'

function rowToInspection(row: any): Inspection {
  return {
    id: row.id,
    name: row.name,
    standardId: row.standard_id,
    standardName: row.standard_name,
    note: row.note ?? undefined,
    price: row.price ?? undefined,
    samplingPoint: row.sampling_point ? JSON.parse(row.sampling_point) : undefined,
    samplingDate: row.sampling_date ?? undefined,
    totalSample: row.total_sample,
    composition: JSON.parse(row.composition),
    defects: JSON.parse(row.defects),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function insertInspection(i: Inspection): void {
  getDb().prepare(`
    INSERT INTO inspections
    (id, name, standard_id, standard_name, note, price, sampling_point,
     sampling_date, total_sample, composition, defects, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    i.id, i.name, i.standardId, i.standardName,
    i.note ?? null, i.price ?? null,
    i.samplingPoint ? JSON.stringify(i.samplingPoint) : null,
    i.samplingDate ?? null, i.totalSample,
    JSON.stringify(i.composition), JSON.stringify(i.defects),
    i.createdAt, i.updatedAt,
  )
}

export function findInspectionById(id: string): Inspection | undefined {
  const row = getDb().prepare('SELECT * FROM inspections WHERE id = ?').get(id)
  return row ? rowToInspection(row) : undefined
}

export function findAllInspections(inspectionId?: string): HistoryListItem[] {
  const db = getDb()
  const rows: any[] = inspectionId
    ? db.prepare(`SELECT id, name, standard_name, note, created_at FROM inspections WHERE id LIKE ? ORDER BY created_at DESC`).all(`%${inspectionId}%`)
    : db.prepare(`SELECT id, name, standard_name, note, created_at FROM inspections ORDER BY created_at DESC`).all()
  return rows.map(r => ({
    id: r.id, name: r.name, standardName: r.standard_name,
    note: r.note ?? undefined, createdAt: r.created_at,
  }))
}

export function updateInspection(id: string, p: UpdateInspectionPayload): Inspection | undefined {
  const now = new Date().toISOString()
  getDb().prepare(`
    UPDATE inspections
    SET note = ?, price = ?, sampling_point = ?, sampling_date = ?, updated_at = ?
    WHERE id = ?
  `).run(
    p.note ?? null, p.price ?? null,
    p.samplingPoint ? JSON.stringify(p.samplingPoint) : null,
    p.samplingDate ?? null, now, id,
  )
  return findInspectionById(id)
}

export function deleteInspections(ids: string[]): void {
  const placeholders = ids.map(() => '?').join(',')
  getDb().prepare(`DELETE FROM inspections WHERE id IN (${placeholders})`).run(...ids)
}
