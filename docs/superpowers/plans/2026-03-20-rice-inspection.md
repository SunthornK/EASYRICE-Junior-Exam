# Rice Inspection App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack rice inspection web app with pnpm monorepo, Express+SQLite backend, and Vite+React frontend.

**Architecture:** pnpm monorepo with `apps/frontend` (Vite+React, port 5173), `apps/backend` (Express, port 3000), and `packages/shared` (TypeScript types). Frontend proxies `/api` to backend in dev. Calculation logic lives in `inspectionService.ts`, data persistence in `historyRepo.ts`.

**Tech Stack:** pnpm workspaces, TypeScript 5, Express 4, better-sqlite3, nanoid v3, Vite 5, React 18, TanStack Query v5, react-hook-form v7, zod v3, vitest, supertest

---

## File Map

### Root
| File | Purpose |
|------|---------|
| `package.json` | Root scripts only (dev, build, test) |
| `pnpm-workspace.yaml` | Declares apps/* and packages/* |
| `tsconfig.base.json` | Shared TS options (strict: true) |
| `.gitignore` | node_modules, dist, .env, *.db |

### packages/shared
| File | Purpose |
|------|---------|
| `package.json` | name: @easyrice/shared |
| `tsconfig.json` | Extends tsconfig.base.json |
| `src/types.ts` | All shared types |

### apps/backend
| File | Purpose |
|------|---------|
| `package.json` | Dependencies + scripts |
| `tsconfig.json` | CommonJS module output |
| `.env.example` | RAW_JSON_URL, STANDARDS_JSON_URL, PORT |
| `src/index.ts` | App factory + startup (CORS, routes, DB init) |
| `src/routes/standard.ts` | GET /standard |
| `src/routes/history.ts` | All /history routes |
| `src/services/standardService.ts` | Fetch + cache standards.json from S3 |
| `src/services/inspectionService.ts` | calculate() — grain matching → composition + defects |
| `src/db/schema.ts` | openDb(), initDb(), getDb() |
| `src/db/historyRepo.ts` | insert, findById, findAll, update, deleteMany |
| `src/__tests__/inspectionService.test.ts` | Unit tests for calculation |
| `src/__tests__/historyRepo.test.ts` | Integration tests with in-memory SQLite |
| `src/__tests__/routes.test.ts` | Route integration tests with supertest |

### apps/frontend
| File | Purpose |
|------|---------|
| `package.json` | Dependencies + scripts |
| `tsconfig.json` | ESNext + JSX |
| `vite.config.ts` | Proxy /api → http://localhost:3000 |
| `index.html` | HTML entry point |
| `src/main.tsx` | QueryClientProvider + BrowserRouter + routes |
| `src/api/client.ts` | Typed fetch wrappers |
| `src/utils/date.ts` | formatDate(iso → DD/MM/YYYY HH:mm:ss), formatDateInput |
| `src/types/index.ts` | Frontend-only types |
| `src/components/InspectionForm.tsx` | Shared form fields + exported zod schemas |
| `src/components/CompositionTable.tsx` | Renders CompositionRow[] |
| `src/components/DefectTable.tsx` | Renders DefectRow[] |
| `src/pages/CreateInspection.tsx` | Create form → POST /history → navigate to result |
| `src/pages/Result.tsx` | Fetch + display full inspection |
| `src/pages/EditResult.tsx` | Edit form → PUT /history/:id → back to result |
| `src/pages/History.tsx` | Table list, search, delete |
| `src/__tests__/date.test.ts` | Unit tests for date formatting |

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "easyrice",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm --recursive run build",
    "test": "pnpm --recursive run test"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 3: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
*.db
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore
git commit -m "chore: monorepo scaffold"
```

---

## Task 2: Shared Types Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types.ts`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@easyrice/shared",
  "version": "1.0.0",
  "main": "dist/types.js",
  "types": "dist/types.d.ts",
  "scripts": { "build": "tsc" }
}
```

- [ ] **Step 2: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "module": "CommonJS",
    "target": "ES2020"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create packages/shared/src/types.ts**

```typescript
export type Condition = 'GT' | 'GE' | 'LT' | 'LE'
export type GrainShape = 'wholegrain' | 'broken'
export type GrainType = 'white' | 'yellow' | 'red' | 'damage' | 'paddy' | 'chalky' | 'glutinous'
export type SamplingPoint = 'Front End' | 'Back End' | 'Other'

export interface RawGrain {
  length: number
  weight: number
  shape: GrainShape
  type: GrainType
}

export interface SubStandard {
  key: string
  name: string
  maxLength: number
  minLength: number
  conditionMax: Condition
  conditionMin: Condition
  shape: GrainShape[]
}

export interface Standard {
  id: string
  name: string
  createDate: string
  standardData: SubStandard[]
}

// Range fields included: Result page shows a "Length" column per subStandard
export interface CompositionRow {
  key: string
  name: string
  minLength: number
  maxLength: number
  conditionMin: Condition
  conditionMax: Condition
  actualPercent: number
  actualWeight: number
}

export interface DefectRow {
  type: GrainType
  name: string  // Thai display name — set by backend lookup table
  actualPercent: number
  actualWeight: number
}

export interface Inspection {
  id: string
  name: string
  standardId: string
  standardName: string
  note?: string
  price?: number
  samplingPoint?: SamplingPoint[]
  samplingDate?: string
  totalSample: number
  composition: CompositionRow[]
  defects: DefectRow[]
  createdAt: string
  updatedAt: string
}

// Lightweight list type — no composition/defects (intentional)
export interface HistoryListItem {
  id: string
  name: string
  standardName: string
  note?: string
  createdAt: string
}

export interface CreateInspectionPayload {
  name: string
  standardId: string
  note?: string
  price?: number
  samplingPoint?: SamplingPoint[]
  samplingDate?: string
  rawData?: RawGrain[]
}

export interface UpdateInspectionPayload {
  note?: string
  price?: number
  samplingPoint?: SamplingPoint[]
  samplingDate?: string
}
```

- [ ] **Step 4: Install and build**

```bash
cd packages/shared && pnpm install && pnpm build
```

Expected: `dist/` folder with `types.js` and `types.d.ts`

- [ ] **Step 5: Commit**

```bash
git add packages/
git commit -m "feat: shared types package"
```

---

## Task 3: Backend Scaffold

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/.env.example`
- Create: `apps/backend/src/index.ts`

- [ ] **Step 1: Create apps/backend/package.json**

```json
{
  "name": "@easyrice/backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@easyrice/shared": "workspace:*",
    "better-sqlite3": "^9.0.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "nanoid": "^3.3.7"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "@types/supertest": "^6.0.0",
    "supertest": "^6.3.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

Note: nanoid v3 is used (CommonJS compatible). nanoid v4+ is ESM-only and will break with `require()`.

- [ ] **Step 2: Create apps/backend/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "module": "CommonJS",
    "target": "ES2020",
    "moduleResolution": "node"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create apps/backend/.env.example**

```
RAW_JSON_URL=https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/raw.json
STANDARDS_JSON_URL=https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/standards.json
PORT=3000
```

- [ ] **Step 4: Create apps/backend/src/index.ts**

```typescript
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
```

- [ ] **Step 5: Install deps**

```bash
cd apps/backend && pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/
git commit -m "chore: backend scaffold"
```

---

## Task 4: SQLite Schema

**Files:**
- Create: `apps/backend/src/db/schema.ts`

- [ ] **Step 1: Create apps/backend/src/db/schema.ts**

```typescript
import Database from 'better-sqlite3'
import path from 'path'

let db: Database.Database

export function openDb(filepath?: string): Database.Database {
  const dbPath = filepath ?? path.join(process.cwd(), 'data.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call openDb() first.')
  return db
}

export function initDb(filepath?: string): void {
  const database = openDb(filepath)
  database.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      standard_id    TEXT NOT NULL,
      standard_name  TEXT NOT NULL,
      note           TEXT,
      price          REAL,
      sampling_point TEXT,
      sampling_date  TEXT,
      total_sample   INTEGER NOT NULL,
      composition    TEXT NOT NULL,
      defects        TEXT NOT NULL,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    )
  `)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/db/schema.ts
git commit -m "feat: SQLite schema"
```

---

## Task 5: History Repository (TDD)

**Files:**
- Create: `apps/backend/src/db/historyRepo.ts`
- Create: `apps/backend/src/__tests__/historyRepo.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/backend/src/__tests__/historyRepo.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/backend && pnpm test -- historyRepo
```

Expected: FAIL — `historyRepo` module not found

- [ ] **Step 3: Implement apps/backend/src/db/historyRepo.ts**

```typescript
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/backend && pnpm test -- historyRepo
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/db/ apps/backend/src/__tests__/historyRepo.test.ts
git commit -m "feat: history repository (TDD)"
```

---

## Task 6: Standard Service

**Files:**
- Create: `apps/backend/src/services/standardService.ts`

- [ ] **Step 1: Create apps/backend/src/services/standardService.ts**

```typescript
import type { Standard } from '@easyrice/shared'

let cache: Standard[] | null = null

export async function loadStandards(): Promise<void> {
  const url = process.env.STANDARDS_JSON_URL
  if (!url) throw new Error('STANDARDS_JSON_URL not set')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch standards: ${res.status}`)
  cache = await res.json() as Standard[]
}

export function getStandards(): Standard[] {
  if (!cache) throw new Error('Standards not loaded')
  return cache
}

export function getStandardById(id: string): Standard | undefined {
  return getStandards().find(s => s.id === id)
}

// Used in tests to inject standards without S3 fetch
export function setStandardsForTesting(standards: Standard[]): void {
  cache = standards
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/services/standardService.ts
git commit -m "feat: standard service"
```

---

## Task 7: Inspection Calculation Service (TDD)

**Files:**
- Create: `apps/backend/src/services/inspectionService.ts`
- Create: `apps/backend/src/__tests__/inspectionService.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/backend/src/__tests__/inspectionService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculate } from '../services/inspectionService'
import type { RawGrain, Standard } from '@easyrice/shared'

const standard: Standard = {
  id: 'std-1', name: 'Test', createDate: '2024-01-01',
  standardData: [
    { key: 'whole', name: 'ข้าวเต็มเมล็ด', minLength: 6, maxLength: 10, conditionMin: 'GE', conditionMax: 'LE', shape: ['wholegrain'] },
    { key: 'broken', name: 'ข้าวหัก', minLength: 0, maxLength: 6, conditionMin: 'GE', conditionMax: 'LT', shape: ['broken'] },
  ],
}

const grains: RawGrain[] = [
  { length: 7.0, weight: 0.02, shape: 'wholegrain', type: 'white' },
  { length: 8.0, weight: 0.03, shape: 'wholegrain', type: 'yellow' },
  { length: 4.0, weight: 0.01, shape: 'broken', type: 'white' },
  { length: 3.0, weight: 0.01, shape: 'broken', type: 'chalky' },
]

describe('calculate', () => {
  it('returns totalSample equal to grain count', () => {
    expect(calculate(grains, standard).totalSample).toBe(4)
  })

  it('calculates composition percentages from total weight', () => {
    const result = calculate(grains, standard)
    const whole = result.composition.find(c => c.key === 'whole')!
    expect(whole.actualPercent).toBeCloseTo((0.05 / 0.07) * 100, 1)
  })

  it('calculates defect percentages by type', () => {
    const result = calculate(grains, standard)
    const yellow = result.defects.find(d => d.type === 'yellow')!
    expect(yellow.actualPercent).toBeCloseTo((0.03 / 0.07) * 100, 1)
  })

  it('handles strict GT/LT conditions — boundary grain is excluded', () => {
    const strict: Standard = {
      ...standard,
      standardData: [{ key: 'mid', name: 'mid', minLength: 6, maxLength: 10, conditionMin: 'GT', conditionMax: 'LT', shape: ['wholegrain'] }],
    }
    const borderGrains: RawGrain[] = [
      { length: 6.0, weight: 0.01, shape: 'wholegrain', type: 'white' }, // excluded
      { length: 7.0, weight: 0.01, shape: 'wholegrain', type: 'white' }, // included
      { length: 10.0, weight: 0.01, shape: 'wholegrain', type: 'white' }, // excluded
    ]
    const result = calculate(borderGrains, strict)
    expect(result.composition.find(c => c.key === 'mid')!.actualWeight).toBeCloseTo(0.01, 5)
  })

  it('unmatched grains are included in totalWeight but not composition', () => {
    const twoGrains: RawGrain[] = [
      { length: 7.0, weight: 0.02, shape: 'wholegrain', type: 'white' },
      { length: 99.0, weight: 0.10, shape: 'wholegrain', type: 'white' }, // no match
    ]
    const result = calculate(twoGrains, standard)
    const whole = result.composition.find(c => c.key === 'whole')!
    expect(whole.actualPercent).toBeCloseTo((0.02 / 0.12) * 100, 1)
  })

  it('rounds all values to 2 decimal places', () => {
    const result = calculate(grains, standard)
    result.composition.forEach(r => {
      expect(r.actualPercent).toBe(Math.round(r.actualPercent * 100) / 100)
    })
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/backend && pnpm test -- inspectionService
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement apps/backend/src/services/inspectionService.ts**

```typescript
import type { RawGrain, Standard, CompositionRow, DefectRow, GrainType } from '@easyrice/shared'

const DEFECT_NAMES: Record<GrainType, string> = {
  white: 'ข้าวขาว', yellow: 'ข้าวเหลือง', red: 'ข้าวแดง',
  damage: 'ข้าวเสีย', paddy: 'ข้าวเปลือก', chalky: 'ข้าวท้องไข่', glutinous: 'ข้าวเหนียว',
}

function matchesLength(length: number, min: number, max: number, condMin: string, condMax: string): boolean {
  const minOk = condMin === 'GT' ? length > min : length >= min
  const maxOk = condMax === 'LT' ? length < max : length <= max
  return minOk && maxOk
}

function round2(n: number): number { return Math.round(n * 100) / 100 }

export interface CalculationResult {
  composition: CompositionRow[]
  defects: DefectRow[]
  totalSample: number
}

export function calculate(grains: RawGrain[], standard: Standard): CalculationResult {
  const compWeights: Record<string, number> = {}
  const defectWeights: Partial<Record<GrainType, number>> = {}
  let totalWeight = 0

  standard.standardData.forEach(sub => { compWeights[sub.key] = 0 })

  for (const grain of grains) {
    totalWeight += grain.weight
    const matched = standard.standardData.find(sub =>
      sub.shape.includes(grain.shape) &&
      matchesLength(grain.length, sub.minLength, sub.maxLength, sub.conditionMin, sub.conditionMax)
    )
    if (matched) compWeights[matched.key] += grain.weight
    defectWeights[grain.type] = (defectWeights[grain.type] ?? 0) + grain.weight
  }

  const composition: CompositionRow[] = standard.standardData.map(sub => ({
    key: sub.key, name: sub.name,
    minLength: sub.minLength, maxLength: sub.maxLength,
    conditionMin: sub.conditionMin, conditionMax: sub.conditionMax,
    actualPercent: totalWeight > 0 ? round2((compWeights[sub.key] / totalWeight) * 100) : 0,
    actualWeight: round2(compWeights[sub.key]),
  }))

  const defects: DefectRow[] = (Object.keys(DEFECT_NAMES) as GrainType[])
    .filter(type => defectWeights[type] !== undefined)
    .map(type => ({
      type, name: DEFECT_NAMES[type],
      actualPercent: totalWeight > 0 ? round2((defectWeights[type]! / totalWeight) * 100) : 0,
      actualWeight: round2(defectWeights[type]!),
    }))

  return { composition, defects, totalSample: grains.length }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/backend && pnpm test -- inspectionService
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/services/inspectionService.ts apps/backend/src/__tests__/inspectionService.test.ts
git commit -m "feat: inspection calculation service (TDD)"
```

---

## Task 8: Backend Routes + Integration Tests

**Files:**
- Create: `apps/backend/src/routes/standard.ts`
- Create: `apps/backend/src/routes/history.ts`
- Create: `apps/backend/src/__tests__/routes.test.ts`

- [ ] **Step 1: Create apps/backend/src/routes/standard.ts**

```typescript
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
```

- [ ] **Step 2: Create apps/backend/src/routes/history.ts**

```typescript
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
  const inspectionId = req.query.inspectionId as string | undefined
  res.json(findAllInspections(inspectionId))
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
  if (body.rawData) {
    grains = body.rawData
  } else {
    const url = process.env.RAW_JSON_URL
    if (!url) return res.status(500).json({ error: 'RAW_JSON_URL not configured' })
    const fetchRes = await fetch(url)
    if (!fetchRes.ok) return res.status(502).json({ error: 'Failed to fetch raw grain data' })
    grains = await fetchRes.json() as RawGrain[]
  }

  const { composition, defects, totalSample } = calculate(grains, standard)
  const now = new Date().toISOString()
  const inspection = {
    id: nanoid(), name: body.name,
    standardId: body.standardId, standardName: standard.name,
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
```

- [ ] **Step 3: Write integration tests**

Create `apps/backend/src/__tests__/routes.test.ts`:

```typescript
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
```

- [ ] **Step 4: Run all backend tests**

```bash
cd apps/backend && pnpm test
```

Expected: All tests PASS (inspectionService + historyRepo + routes)

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/ apps/backend/src/__tests__/routes.test.ts
git commit -m "feat: backend API routes + integration tests"
```

---

## Task 9: Backend Smoke Test

- [ ] **Step 1: Copy .env**

```bash
cp apps/backend/.env.example apps/backend/.env
```

- [ ] **Step 2: Start backend**

```bash
cd apps/backend && pnpm dev
```

Expected: `Backend running on port 3000` (standards loaded from S3)

- [ ] **Step 3: Verify GET /standard**

```bash
curl http://localhost:3000/standard
```

Expected: JSON array of standards

- [ ] **Step 4: Stop server, run full test suite**

```bash
cd apps/backend && pnpm test
```

Expected: All PASS

---

## Task 10: Frontend Scaffold

**Files:**
- Create: `apps/frontend/package.json`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/index.html`

- [ ] **Step 1: Create apps/frontend/package.json**

```json
{
  "name": "@easyrice/frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@easyrice/shared": "workspace:*",
    "@tanstack/react-query": "^5.0.0",
    "@hookform/resolvers": "^3.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-hook-form": "^7.0.0",
    "react-router-dom": "^6.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create apps/frontend/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create apps/frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

- [ ] **Step 4: Create apps/frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rice Inspection</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install deps**

```bash
cd apps/frontend && pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/
git commit -m "chore: frontend scaffold"
```

---

## Task 11: Frontend Foundation

**Files:**
- Create: `apps/frontend/src/utils/date.ts`
- Create: `apps/frontend/src/__tests__/date.test.ts`
- Create: `apps/frontend/src/types/index.ts`
- Create: `apps/frontend/src/api/client.ts`
- Create: `apps/frontend/src/main.tsx`

- [ ] **Step 1: Write failing date tests**

Create `apps/frontend/src/__tests__/date.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { formatDate, formatDateInput } from '../utils/date'

describe('formatDate', () => {
  it('formats ISO string to DD/MM/YYYY HH:mm:ss', () => {
    const result = formatDate('2026-03-20T03:05:30.000Z')
    expect(result).toMatch(/\d{2}\/\d{2}\/2026 \d{2}:\d{2}:\d{2}/)
  })
  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatDateInput', () => {
  it('returns YYYY-MM-DDTHH:mm for datetime-local input', () => {
    expect(formatDateInput('2026-03-20T10:05:30.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
  it('returns empty string for undefined', () => {
    expect(formatDateInput(undefined)).toBe('')
  })
})
```

- [ ] **Step 2: Run tests — verify fail**

```bash
cd apps/frontend && pnpm test -- date
```

- [ ] **Step 3: Create apps/frontend/src/utils/date.ts**

```typescript
export function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function formatDateInput(iso: string | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 16) // 'YYYY-MM-DDTHH:mm'
}
```

- [ ] **Step 4: Run tests — verify pass**

```bash
cd apps/frontend && pnpm test -- date
```

- [ ] **Step 5: Create apps/frontend/src/types/index.ts**

```typescript
export interface FormState {
  isSubmitting: boolean
  error: string | null
}
```

- [ ] **Step 6: Create apps/frontend/src/api/client.ts**

```typescript
import type {
  Standard, Inspection, HistoryListItem,
  CreateInspectionPayload, UpdateInspectionPayload,
} from '@easyrice/shared'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Calls GET /api/standard (singular — intentional per Swagger spec)
export const getStandards = (): Promise<Standard[]> => request('/standard')
export const createInspection = (p: CreateInspectionPayload): Promise<Inspection> =>
  request('/history', { method: 'POST', body: JSON.stringify(p) })
export const getInspection = (id: string): Promise<Inspection> => request(`/history/${id}`)
export const updateInspection = (id: string, p: UpdateInspectionPayload): Promise<Inspection> =>
  request(`/history/${id}`, { method: 'PUT', body: JSON.stringify(p) })
export const getHistory = (inspectionId?: string): Promise<HistoryListItem[]> =>
  request(`/history${inspectionId ? `?inspectionId=${encodeURIComponent(inspectionId)}` : ''}`)
export const deleteHistory = (ids: string[]): Promise<void> =>
  request('/history', { method: 'DELETE', body: JSON.stringify({ ids }) })
```

- [ ] **Step 7: Create stub exports for all four pages** (required before wiring main.tsx — TypeScript will error without them)

Create each of these files with a minimal export:
```typescript
// apps/frontend/src/pages/CreateInspection.tsx
export function CreateInspection() { return <div>Create Inspection</div> }
// repeat pattern for Result.tsx, EditResult.tsx, History.tsx
```

- [ ] **Step 8: Create apps/frontend/src/main.tsx** (stub pages imported — replace stubs with real implementations in Tasks 14–17)

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CreateInspection } from './pages/CreateInspection'
import { Result } from './pages/Result'
import { EditResult } from './pages/EditResult'
import { History } from './pages/History'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreateInspection />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/result/:id/edit" element={<EditResult />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
```

Note: Create stub exports in each page file (`export function CreateInspection() { return <div>TODO</div> }`) before wiring main.tsx, or TypeScript will error.

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/
git commit -m "feat: frontend foundation (utils, api client, router)"
```

---

## Task 12: Shared Form Component + Zod Schemas

**Files:**
- Create: `apps/frontend/src/components/InspectionForm.tsx`

- [ ] **Step 1: Create apps/frontend/src/components/InspectionForm.tsx**

```typescript
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import type { Standard } from '@easyrice/shared'

export const inspectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  standardId: z.string().min(1, 'Standard is required'),
  note: z.string().optional(),
  price: z.union([
    z.string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Up to 2 decimal places')
      .refine(v => Number(v) >= 0 && Number(v) <= 100000, 'Must be 0–100,000')
      .transform(Number),
    z.literal(''),
  ]).optional(),
  samplingPoint: z.array(z.enum(['Front End', 'Back End', 'Other'])).optional(),
  samplingDate: z.string().optional(),
})

export const editInspectionSchema = inspectionSchema.pick({
  note: true, price: true, samplingPoint: true, samplingDate: true,
})

export type InspectionFormValues = z.infer<typeof inspectionSchema>

const SAMPLING_POINTS = ['Front End', 'Back End', 'Other'] as const

interface Props {
  standards?: Standard[]
  showName?: boolean
  showStandard?: boolean
}

export function InspectionForm({ standards = [], showName = false, showStandard = false }: Props) {
  const { register, formState: { errors } } = useFormContext<InspectionFormValues>()

  return (
    <div>
      {showName && (
        <div>
          <label>Name *</label>
          <input {...register('name')} />
          {errors.name && <span style={{ color: 'red' }}>{errors.name.message}</span>}
        </div>
      )}

      {showStandard && (
        <div>
          <label>Standard *</label>
          <select {...register('standardId')}>
            <option value="">-- Select --</option>
            {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.standardId && <span style={{ color: 'red' }}>{errors.standardId.message}</span>}
        </div>
      )}

      <div>
        <label>Note</label>
        <textarea {...register('note')} />
      </div>

      <div>
        <label>Price (0–100,000)</label>
        <input {...register('price')} type="text" placeholder="e.g. 1500.50" />
        {errors.price && <span style={{ color: 'red' }}>{errors.price.message}</span>}
      </div>

      <div>
        <label>Sampling Point</label>
        {SAMPLING_POINTS.map(p => (
          <label key={p}>
            <input type="checkbox" value={p} {...register('samplingPoint')} />
            {p}
          </label>
        ))}
      </div>

      <div>
        <label>Date/Time of Sampling</label>
        <input {...register('samplingDate')} type="datetime-local" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/InspectionForm.tsx
git commit -m "feat: InspectionForm component + zod schemas"
```

---

## Task 13: Result Display Components

**Files:**
- Create: `apps/frontend/src/components/CompositionTable.tsx`
- Create: `apps/frontend/src/components/DefectTable.tsx`

- [ ] **Step 1: Create CompositionTable.tsx**

```typescript
import type { CompositionRow, Condition } from '@easyrice/shared'

function formatRange(min: number, max: number, condMin: Condition, condMax: Condition): string {
  return `${condMin === 'GT' ? `>${min}` : `≥${min}`} – ${condMax === 'LT' ? `<${max}` : `≤${max}`}`
}

export function CompositionTable({ rows }: { rows: CompositionRow[] }) {
  return (
    <table>
      <thead>
        <tr><th>Name</th><th>Length (mm)</th><th>Actual (%)</th><th>Actual (g)</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.key}>
            <td>{r.name}</td>
            <td>{formatRange(r.minLength, r.maxLength, r.conditionMin, r.conditionMax)}</td>
            <td>{r.actualPercent.toFixed(2)}%</td>
            <td>{r.actualWeight.toFixed(2)}g</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Create DefectTable.tsx**

```typescript
import type { DefectRow } from '@easyrice/shared'

export function DefectTable({ rows }: { rows: DefectRow[] }) {
  return (
    <table>
      <thead>
        <tr><th>Name</th><th>Actual (%)</th><th>Actual (g)</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.type}>
            <td>{r.name}</td>
            <td>{r.actualPercent.toFixed(2)}%</td>
            <td>{r.actualWeight.toFixed(2)}g</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/
git commit -m "feat: CompositionTable and DefectTable"
```

---

## Task 14: CreateInspection Page

**Files:**
- Create: `apps/frontend/src/pages/CreateInspection.tsx`

- [ ] **Step 1: Create apps/frontend/src/pages/CreateInspection.tsx**

```typescript
import { useState, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { InspectionForm, inspectionSchema, type InspectionFormValues } from '../components/InspectionForm'
import { getStandards, createInspection } from '../api/client'
import type { RawGrain } from '@easyrice/shared'

export function CreateInspection() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [rawData, setRawData] = useState<RawGrain[] | undefined>()
  const [fileError, setFileError] = useState<string | null>(null)

  const { data: standards = [] } = useQuery({
    queryKey: ['standards'],
    queryFn: getStandards,
    staleTime: Infinity,
  })

  const methods = useForm<InspectionFormValues>({ resolver: zodResolver(inspectionSchema) })

  const mutation = useMutation({
    mutationFn: createInspection,
    onSuccess: (inspection) => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(`/result/${inspection.id}`)
    },
  })

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as RawGrain[]
        if (!Array.isArray(parsed)) throw new Error()
        setRawData(parsed)
        setFileError(null)
      } catch {
        setFileError('Invalid JSON file — expected RawGrain[] array')
        setRawData(undefined)
      }
    }
    reader.readAsText(file)
  }

  function onSubmit(values: InspectionFormValues) {
    mutation.mutate({
      name: values.name,
      standardId: values.standardId,
      note: values.note,
      price: values.price as number | undefined,
      samplingPoint: values.samplingPoint,
      samplingDate: values.samplingDate ? new Date(values.samplingDate).toISOString() : undefined,
      rawData,
    })
  }

  return (
    <div>
      <h1>Create Inspection</h1>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <InspectionForm standards={standards} showName showStandard />

          <div>
            <label>Upload raw data (.json)</label>
            <input type="file" accept=".json" onChange={handleFile} />
            {fileError && <p style={{ color: 'red' }}>{fileError}</p>}
            {rawData && <p style={{ color: 'green' }}>Loaded {rawData.length} grains from file</p>}
          </div>

          {mutation.isError && <p style={{ color: 'red' }}>{(mutation.error as Error).message}</p>}

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
          <button type="button" onClick={() => navigate('/history')}>History</button>
        </form>
      </FormProvider>
    </div>
  )
}
```

- [ ] **Step 2: Start both servers and manually verify create flow**

Terminal 1: `cd apps/backend && pnpm dev`
Terminal 2: `cd apps/frontend && pnpm dev`

Open `http://localhost:5173`, fill Name + Standard, Submit. Expect redirect to `/result/:id`.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/CreateInspection.tsx
git commit -m "feat: CreateInspection page"
```

---

## Task 15: Result Page

**Files:**
- Create: `apps/frontend/src/pages/Result.tsx`

- [ ] **Step 1: Create apps/frontend/src/pages/Result.tsx**

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInspection } from '../api/client'
import { CompositionTable } from '../components/CompositionTable'
import { DefectTable } from '../components/DefectTable'
import { formatDate } from '../utils/date'

export function Result() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: inspection, isLoading, isError } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => getInspection(id!),
    enabled: !!id,
  })

  if (isLoading) return <p>Loading...</p>
  if (isError || !inspection) return <p>Not found.</p>

  return (
    <div>
      <h1>Inspection Result</h1>

      <section>
        <h2>Basic Information</h2>
        <table>
          <tbody>
            <tr><td>Create Date - Time</td><td>{formatDate(inspection.createdAt)}</td></tr>
            <tr><td>Inspection ID</td><td>{inspection.id}</td></tr>
            <tr><td>Standard</td><td>{inspection.standardName}</td></tr>
            <tr><td>Total Sample</td><td>{inspection.totalSample}</td></tr>
            <tr><td>Update Date - Time</td><td>{formatDate(inspection.updatedAt)}</td></tr>
            <tr><td>Note</td><td>{inspection.note ?? '-'}</td></tr>
            {inspection.price !== undefined && <tr><td>Price</td><td>{inspection.price}</td></tr>}
            {inspection.samplingDate && <tr><td>Date/Time of Sampling</td><td>{formatDate(inspection.samplingDate)}</td></tr>}
            {inspection.samplingPoint && <tr><td>Sampling Point</td><td>{inspection.samplingPoint.join(', ')}</td></tr>}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Composition</h2>
        <CompositionTable rows={inspection.composition} />
      </section>

      <section>
        <h2>Defect Rice</h2>
        <DefectTable rows={inspection.defects} />
      </section>

      <button onClick={() => navigate('/')}>Back</button>
      <button onClick={() => navigate(`/result/${id}/edit`)}>Edit</button>
    </div>
  )
}
```

- [ ] **Step 2: Verify manually — create an inspection, confirm Result page shows all sections**

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/Result.tsx
git commit -m "feat: Result page"
```

---

## Task 16: EditResult Page

**Files:**
- Create: `apps/frontend/src/pages/EditResult.tsx`

- [ ] **Step 1: Create apps/frontend/src/pages/EditResult.tsx**

```typescript
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInspection, updateInspection } from '../api/client'
import { InspectionForm, editInspectionSchema, type InspectionFormValues } from '../components/InspectionForm'
import { formatDateInput } from '../utils/date'

export function EditResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => getInspection(id!),
    enabled: !!id,
  })

  const methods = useForm<Partial<InspectionFormValues>>({
    resolver: zodResolver(editInspectionSchema),
    values: inspection ? {
      note: inspection.note ?? '',
      price: inspection.price !== undefined ? String(inspection.price) : '',
      samplingPoint: inspection.samplingPoint ?? [],
      samplingDate: formatDateInput(inspection.samplingDate),
    } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (values: Partial<InspectionFormValues>) =>
      updateInspection(id!, {
        note: values.note || undefined,
        price: values.price as number | undefined,
        samplingPoint: values.samplingPoint,
        samplingDate: values.samplingDate ? new Date(values.samplingDate).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(`/result/${id}`)
    },
  })

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <h1>Edit Result</h1>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(v => mutation.mutate(v))}>
          <InspectionForm /> {/* no showName, no showStandard */}

          {mutation.isError && <p style={{ color: 'red' }}>{(mutation.error as Error).message}</p>}

          <button type="button" onClick={() => navigate(`/result/${id}`)}>Cancel</button>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </FormProvider>
    </div>
  )
}
```

- [ ] **Step 2: Verify Edit flow — click Edit on Result, update note, Submit, confirm updated note**

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/EditResult.tsx
git commit -m "feat: EditResult page"
```

---

## Task 17: History Page

**Files:**
- Create: `apps/frontend/src/pages/History.tsx`

- [ ] **Step 1: Create apps/frontend/src/pages/History.tsx**

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHistory, deleteHistory } from '../api/client'
import { formatDate } from '../utils/date'

export function History() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [searchId, setSearchId] = useState<string | undefined>()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['history', searchId],
    queryFn: () => getHistory(searchId),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHistory,
    onSuccess: () => {
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div>
      <h1>History</h1>

      <div>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Search by Inspection ID"
          onKeyDown={e => e.key === 'Enter' && setSearchId(searchInput.trim() || undefined)}
        />
        <button onClick={() => setSearchId(searchInput.trim() || undefined)}>Search</button>
        <button onClick={() => { setSearchInput(''); setSearchId(undefined) }}>Clear</button>
      </div>

      <div>
        <button
          disabled={selected.size === 0 || deleteMutation.isPending}
          onClick={() => {
            if (confirm(`Delete ${selected.size} record(s)?`)) deleteMutation.mutate([...selected])
          }}
        >
          Delete Selected ({selected.size})
        </button>
        <button onClick={() => navigate('/')}>New Inspection</button>
      </div>

      {isLoading && <p>Loading...</p>}

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Create Date - Time</th>
            <th>Inspection ID</th>
            <th>Name</th>
            <th>Standard</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => navigate(`/result/${item.id}`)} style={{ cursor: 'pointer' }}>
              <td onClick={e => { e.stopPropagation(); toggle(item.id) }}>
                <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
              </td>
              <td>{formatDate(item.createdAt)}</td>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.standardName}</td>
              <td>{item.note ?? '-'}</td>
            </tr>
          ))}
          {items.length === 0 && !isLoading && (
            <tr><td colSpan={6} style={{ textAlign: 'center' }}>No records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify History page — list loads, search filters, delete removes rows, row click navigates**

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/History.tsx
git commit -m "feat: History page"
```

---

## Task 18: End-to-End Verification

- [ ] **Step 1: Run all backend tests**

```bash
cd apps/backend && pnpm test
```

Expected: All PASS

- [ ] **Step 2: Run all frontend tests**

```bash
cd apps/frontend && pnpm test
```

Expected: All PASS

- [ ] **Step 3: Full manual walkthrough**

1. Open `http://localhost:5173`
2. Create inspection (name + standard) → verify redirect to Result
3. Verify Result shows Basic Info, Composition table, Defect table
4. Click Edit → update note → Submit → verify updated note on Result
5. Navigate to `/history` → verify record appears
6. Search by partial ID → verify filter works
7. Select record → Delete → verify it disappears
8. Click a row → verify navigates to Result

- [ ] **Step 4: Test file upload**

1. Download `https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/raw.json` locally
2. On Create page, upload the file, submit
3. Verify calculation result is shown

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: rice inspection app complete"
```

---

## Optional Task 19: Postgres + Docker

Only attempt if all above tasks are done and time permits.

- [ ] **Step 1: Add docker-compose.yml at root**

```yaml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: easyrice
      POSTGRES_USER: easyrice
      POSTGRES_PASSWORD: easyrice
    ports:
      - '5432:5432'
```

- [ ] **Step 2: Add pg dependency**

```bash
cd apps/backend && pnpm add pg && pnpm add -D @types/pg
```

- [ ] **Step 3: Add DB_DRIVER env var to .env.example**

```
DB_DRIVER=sqlite
# Set DB_DRIVER=postgres and configure DATABASE_URL to use Postgres
DATABASE_URL=postgresql://easyrice:easyrice@localhost:5432/easyrice
```

- [ ] **Step 4: Refactor schema.ts to support both drivers**

When `DB_DRIVER=postgres`, export a `pg.Pool` and update `historyRepo.ts` queries to use `$1/$2` parameter placeholders instead of `?`. Keep both implementations behind an adapter interface so services don't change.

- [ ] **Step 5: Start Postgres and verify**

```bash
docker compose up -d
DB_DRIVER=postgres pnpm --filter backend dev
```

Run backend tests with Postgres. All should pass.

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml apps/backend/
git commit -m "feat: optional Postgres + Docker support"
```
