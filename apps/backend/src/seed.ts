/**
 * Seed script — inserts mock inspection records for demo/review purposes.
 * Run with: pnpm --filter @easyrice/backend seed
 */
import { initDb } from './db/schema'
import { insertInspection } from './db/historyRepo'
import type { Inspection } from '@easyrice/shared'

initDb()

const inspections: Inspection[] = [
  {
    id: 'INS-2025-001',
    name: 'White Rice Batch A',
    standardId: 'standard-01',
    standardName: 'ข้าวขาว 100%',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Sample from morning delivery',
    price: 18500,
    samplingPoint: ['Front End'],
    samplingDate: '2025-03-10T08:30:00.000Z',
    totalSample: 412,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 72.4, actualWeight: 14.48 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 16.2, actualWeight: 3.24 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 8.9, actualWeight: 1.78 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 2.5, actualWeight: 0.50 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 0.8, actualWeight: 0.16 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 0.3, actualWeight: 0.06 },
      { type: 'chalky', name: 'ข้าวท้องไข่', actualPercent: 1.2, actualWeight: 0.24 },
    ],
    createdAt: '2025-03-10T09:00:00.000Z',
    updatedAt: '2025-03-10T09:00:00.000Z',
  },
  {
    id: 'INS-2025-002',
    name: 'Jasmine Rice Grade 1',
    standardId: 'standard-02',
    standardName: 'ข้าวหอมมะลิ',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Premium export lot — fragrance test passed',
    price: 32000,
    samplingPoint: ['Back End', 'Front End'],
    samplingDate: '2025-03-12T14:00:00.000Z',
    totalSample: 587,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 7, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 85.1, actualWeight: 17.02 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 7, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 10.3, actualWeight: 2.06 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 3.6, actualWeight: 0.72 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 1.0, actualWeight: 0.20 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 0.2, actualWeight: 0.04 },
      { type: 'paddy', name: 'ข้าวเปลือก', actualPercent: 0.1, actualWeight: 0.02 },
    ],
    createdAt: '2025-03-12T14:30:00.000Z',
    updatedAt: '2025-03-15T10:00:00.000Z',
  },
  {
    id: 'INS-2025-003',
    name: 'Mixed Rice Inspection',
    standardId: 'standard-01',
    standardName: 'ข้าวขาว 100%',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    totalSample: 330,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 55.0, actualWeight: 11.00 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 25.0, actualWeight: 5.00 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 14.0, actualWeight: 2.80 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 6.0, actualWeight: 1.20 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 2.1, actualWeight: 0.42 },
      { type: 'red', name: 'ข้าวแดง', actualPercent: 1.5, actualWeight: 0.30 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 0.9, actualWeight: 0.18 },
      { type: 'chalky', name: 'ข้าวท้องไข่', actualPercent: 3.2, actualWeight: 0.64 },
      { type: 'paddy', name: 'ข้าวเปลือก', actualPercent: 0.4, actualWeight: 0.08 },
    ],
    createdAt: '2025-03-18T11:00:00.000Z',
    updatedAt: '2025-03-18T11:00:00.000Z',
  },
  {
    id: 'INS-2025-004',
    name: 'Parboiled Rice Sample',
    standardId: 'standard-03',
    standardName: 'ข้าวนึ่ง',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Requires re-inspection next week',
    price: 15000,
    samplingPoint: ['Other'],
    samplingDate: '2025-03-20T07:45:00.000Z',
    totalSample: 280,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 61.5, actualWeight: 12.30 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 22.0, actualWeight: 4.40 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 12.5, actualWeight: 2.50 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 4.0, actualWeight: 0.80 },
    ],
    defects: [
      { type: 'undermilled', name: 'ข้าวกล้อง', actualPercent: 1.8, actualWeight: 0.36 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 0.6, actualWeight: 0.12 },
      { type: 'chalky', name: 'ข้าวท้องไข่', actualPercent: 2.5, actualWeight: 0.50 },
    ],
    createdAt: '2025-03-20T08:15:00.000Z',
    updatedAt: '2025-03-20T08:15:00.000Z',
  },
  {
    id: 'INS-2025-005',
    name: 'Export Quality Check',
    standardId: 'standard-02',
    standardName: 'ข้าวหอมมะลิ',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    price: 28000,
    samplingPoint: ['Front End'],
    samplingDate: '2025-03-21T10:00:00.000Z',
    totalSample: 500,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 7, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 90.0, actualWeight: 18.00 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 7, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 7.0, actualWeight: 1.40 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 2.5, actualWeight: 0.50 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 0.5, actualWeight: 0.10 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 0.1, actualWeight: 0.02 },
    ],
    createdAt: '2025-03-21T10:30:00.000Z',
    updatedAt: '2025-03-21T10:30:00.000Z',
  },
  {
    id: 'INS-2025-006',
    name: 'Broken Rice Grade C',
    standardId: 'standard-01',
    standardName: 'ข้าวขาว 100%',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'High broken ratio — for animal feed grade',
    price: 8000,
    samplingPoint: ['Back End'],
    samplingDate: '2025-03-05T09:00:00.000Z',
    totalSample: 380,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 20.0, actualWeight: 4.00 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 35.0, actualWeight: 7.00 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 30.0, actualWeight: 6.00 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 15.0, actualWeight: 3.00 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 4.2, actualWeight: 0.84 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 2.8, actualWeight: 0.56 },
      { type: 'red', name: 'ข้าวแดง', actualPercent: 1.5, actualWeight: 0.30 },
    ],
    createdAt: '2025-03-05T09:30:00.000Z',
    updatedAt: '2025-03-05T09:30:00.000Z',
  },
  {
    id: 'INS-2025-007',
    name: 'Glutinous Rice Inspection',
    standardId: 'standard-04',
    standardName: 'ข้าวเหนียว',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Sticky rice seasonal batch',
    price: 22000,
    samplingPoint: ['Front End', 'Back End'],
    samplingDate: '2025-03-07T13:30:00.000Z',
    totalSample: 460,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 5, maxLength: 9, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 78.0, actualWeight: 15.60 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 3, maxLength: 5, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 14.0, actualWeight: 2.80 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 1, maxLength: 3, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 6.0, actualWeight: 1.20 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 1, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 2.0, actualWeight: 0.40 },
    ],
    defects: [
      { type: 'glutinous', name: 'ข้าวเหนียว', actualPercent: 5.0, actualWeight: 1.00 },
      { type: 'chalky', name: 'ข้าวท้องไข่', actualPercent: 2.1, actualWeight: 0.42 },
    ],
    createdAt: '2025-03-07T14:00:00.000Z',
    updatedAt: '2025-03-08T09:00:00.000Z',
  },
  {
    id: 'INS-2025-008',
    name: 'Red Rice Sample',
    standardId: 'standard-01',
    standardName: 'ข้าวขาว 100%',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Contamination check — red grain ratio high',
    totalSample: 310,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 65.0, actualWeight: 13.00 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 20.0, actualWeight: 4.00 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 11.0, actualWeight: 2.20 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 4.0, actualWeight: 0.80 },
    ],
    defects: [
      { type: 'red', name: 'ข้าวแดง', actualPercent: 6.5, actualWeight: 1.30 },
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 1.2, actualWeight: 0.24 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 0.8, actualWeight: 0.16 },
    ],
    createdAt: '2025-03-01T08:00:00.000Z',
    updatedAt: '2025-03-01T08:00:00.000Z',
  },
  {
    id: 'INS-2025-009',
    name: 'Morning Batch QC',
    standardId: 'standard-02',
    standardName: 'ข้าวหอมมะลิ',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    price: 30500,
    samplingPoint: ['Front End'],
    samplingDate: '2025-02-25T06:00:00.000Z',
    totalSample: 540,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 7, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 82.5, actualWeight: 16.50 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 7, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 11.5, actualWeight: 2.30 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 4.5, actualWeight: 0.90 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 1.5, actualWeight: 0.30 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 0.3, actualWeight: 0.06 },
      { type: 'paddy', name: 'ข้าวเปลือก', actualPercent: 0.2, actualWeight: 0.04 },
      { type: 'chalky', name: 'ข้าวท้องไข่', actualPercent: 0.8, actualWeight: 0.16 },
    ],
    createdAt: '2025-02-25T06:30:00.000Z',
    updatedAt: '2025-02-25T06:30:00.000Z',
  },
  {
    id: 'INS-2025-010',
    name: 'Undermilled Batch',
    standardId: 'standard-03',
    standardName: 'ข้าวนึ่ง',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Milling adjustment required',
    price: 12000,
    samplingPoint: ['Back End'],
    samplingDate: '2025-02-20T15:00:00.000Z',
    totalSample: 295,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 58.0, actualWeight: 11.60 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 24.0, actualWeight: 4.80 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 13.0, actualWeight: 2.60 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 5.0, actualWeight: 1.00 },
    ],
    defects: [
      { type: 'undermilled', name: 'ข้าวกล้อง', actualPercent: 8.5, actualWeight: 1.70 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 1.2, actualWeight: 0.24 },
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 0.9, actualWeight: 0.18 },
    ],
    createdAt: '2025-02-20T15:30:00.000Z',
    updatedAt: '2025-02-20T15:30:00.000Z',
  },
  {
    id: 'INS-2025-011',
    name: 'Final Warehouse Check',
    standardId: 'standard-01',
    standardName: 'ข้าวขาว 100%',
    imageURL: 'https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/example-rice.webp',
    note: 'Pre-shipment inspection',
    price: 19800,
    samplingPoint: ['Front End', 'Back End', 'Other'],
    samplingDate: '2025-02-15T11:00:00.000Z',
    totalSample: 620,
    composition: [
      { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', actualPercent: 69.0, actualWeight: 13.80 },
      { key: 'large_broken', name: 'ข้าวหักใหญ่', minLength: 4, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 18.0, actualWeight: 3.60 },
      { key: 'small_broken', name: 'ข้าวหักเล็ก', minLength: 2, maxLength: 4, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 9.5, actualWeight: 1.90 },
      { key: 'brokens', name: 'ปลายข้าว', minLength: 0, maxLength: 2, conditionMin: 'GE', conditionMax: 'LT', actualPercent: 3.5, actualWeight: 0.70 },
    ],
    defects: [
      { type: 'yellow', name: 'ข้าวเหลือง', actualPercent: 1.0, actualWeight: 0.20 },
      { type: 'damage', name: 'ข้าวเสีย', actualPercent: 0.5, actualWeight: 0.10 },
      { type: 'chalky', name: 'ข้าวท้องไข่', actualPercent: 1.8, actualWeight: 0.36 },
      { type: 'paddy', name: 'ข้าวเปลือก', actualPercent: 0.2, actualWeight: 0.04 },
    ],
    createdAt: '2025-02-15T11:30:00.000Z',
    updatedAt: '2025-02-16T08:00:00.000Z',
  },
]

let inserted = 0
for (const inspection of inspections) {
  try {
    insertInspection(inspection)
    console.log(`  ✓ ${inspection.id} — ${inspection.name}`)
    inserted++
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      console.log(`  ~ ${inspection.id} — already exists, skipped`)
    } else {
      throw e
    }
  }
}
console.log(`\nSeeded ${inserted} inspection(s).`)
