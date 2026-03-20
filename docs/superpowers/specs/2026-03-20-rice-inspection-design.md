# Rice Inspection App — Architecture Design

**Date:** 2026-03-20
**Stack:** TypeScript monorepo — Vite + React (frontend), Express (backend), SQLite (database)

---

## 1. Repository Structure

**Approach:** Option B — two apps + shared types package (pnpm workspaces)

```
easyrice/
├── apps/
│   ├── frontend/               # Vite + React + TS (port 5173)
│   └── backend/                # Express + TS (port 3000)
├── packages/
│   └── shared/                 # TypeScript types only — no runtime logic
├── pnpm-workspace.yaml
└── package.json                # Root scripts only
```

**Coupling stance:** `shared` contains only TypeScript interfaces — no runtime logic. Frontend and backend are independently buildable. The shared package acts as a typed contract, not a runtime dependency.

---

## 2. Backend Architecture

### Framework
Express + TypeScript on port `3000`.

### Layers
```
routes/      → HTTP only (parse request → call service → return response)
services/    → Business logic (calculation, standard loading)
db/          → SQLite setup, schema, typed queries
```

### API Routes
```
GET    /standard              → return all standards (cached from S3 at startup)
GET    /history               → list inspections (supports ?inspectionId= for partial match)
GET    /history/:id           → get single full inspection
POST   /history               → create inspection (triggers calculation)
PUT    /history/:id           → update note/price/samplingPoint/samplingDate
DELETE /history               → delete multiple inspections (body: { ids: string[] })
```

### Startup Behavior
- Fetch and cache `standards.json` from S3 once at startup
- Run SQLite schema migrations on startup
- No runtime refresh of standards

### SQLite Schema
```sql
CREATE TABLE inspections (
  id             TEXT PRIMARY KEY,   -- nanoid
  name           TEXT NOT NULL,
  standard_id    TEXT NOT NULL,
  standard_name  TEXT NOT NULL,
  note           TEXT,
  price          REAL,
  sampling_point TEXT,               -- JSON array string
  sampling_date  TEXT,               -- ISO string
  total_sample   INTEGER NOT NULL,
  composition    TEXT NOT NULL,      -- JSON string (CompositionRow[])
  defects        TEXT NOT NULL,      -- JSON string (DefectRow[])
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
```

JSON parse/stringify happens in the repo layer only — services always receive and return typed objects.

### Inspection Calculation (`inspectionService.ts`)
```
1. Receive grains (from uploaded file or fetched raw.json from S3)
2. Load standard by standardId
3. For each grain:
   - Match to a subStandard: grain.shape ∈ subStandard.shape AND
     length satisfies conditionMin/conditionMax (GT, GE, LT, LE all implemented)
   - If no match: skip grain but count its weight in totalWeight (no silent loss)
   - Accumulate weight per matched subStandard (Composition)
   - Accumulate weight per grain.type (Defect)
4. Convert accumulated weights to percentages (weight / totalWeight * 100)
5. Round all percentages and weights to 2 decimal places
6. Return { composition, defects, totalSample }
```

**Condition operators:** All four implemented correctly — GT (`>`), GE (`>=`), LT (`<`), LE (`<=`). A > vs >= mistake shifts grains between categories.

**Unmatched grains:** Skipped from composition/defect assignment but included in totalWeight. Prevents silent percentage inflation.

**ID generation:** nanoid (shorter, cleaner in UI).

---

## 3. Shared Types (`packages/shared`)

```typescript
export type Condition = 'GT' | 'GE' | 'LT' | 'LE'
export type GrainShape = 'wholegrain' | 'broken'
export type GrainType = 'white' | 'yellow' | 'red' | 'damage' | 'paddy' | 'chalky' | 'glutinous'

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
  name: string           // Thai display name e.g. ข้าวเหลือง
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
  samplingPoint?: string[]
  samplingDate?: string
  totalSample: number
  composition: CompositionRow[]
  defects: DefectRow[]
  createdAt: string
  updatedAt: string
}

// Lightweight type for GET /history list — no composition/defects
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
  samplingPoint?: string[]
  samplingDate?: string
  rawData?: RawGrain[]   // if absent, backend fetches from S3
}

export interface UpdateInspectionPayload {
  note?: string
  price?: number
  samplingPoint?: string[]
  samplingDate?: string
}
```

---

## 4. Frontend Architecture

### Stack
Vite + React + TypeScript on port `5173`. Vite dev proxy forwards `/api` → `http://localhost:3000`.

### Libraries
- **React Query (TanStack Query)** — caching, loading/error states, cache invalidation
- **react-hook-form + zod** — form validation
- **React Router** — client-side routing

### Folder Structure
```
src/
├── pages/
│   ├── CreateInspection.tsx
│   ├── Result.tsx
│   ├── EditResult.tsx
│   └── History.tsx
├── components/
│   ├── CompositionTable.tsx
│   ├── DefectTable.tsx
│   └── InspectionForm.tsx      # shared form fields + zod schema
├── api/
│   └── client.ts               # typed fetch wrappers
├── types/
│   └── index.ts                # frontend-only types (UI/form state)
├── utils/
│   └── date.ts                 # formatDate / parseDate (DD/MM/YYYY HH:mm:ss)
└── main.tsx                    # QueryClient provider + router
```

### Routes
```
/                   → CreateInspection
/result/:id         → Result
/result/:id/edit    → EditResult
/history            → History
```

### Validation Schema (zod)
```typescript
const inspectionSchema = z.object({
  name:           z.string().min(1, 'Name is required'),
  standardId:     z.string().min(1, 'Standard is required'),
  note:           z.string().optional(),
  price:          z.number().min(0).max(100000).multipleOf(0.01).optional(),
  samplingPoint:  z.array(z.enum(['Front End', 'Back End', 'Other'])).optional(),
  samplingDate:   z.string().optional(),
})

const editInspectionSchema = inspectionSchema.pick({
  note: true, price: true, samplingPoint: true, samplingDate: true,
})
```

### React Query Keys
```typescript
queryKeys = {
  standards:   ['standards'],                          // cached indefinitely
  inspection:  (id: string) => ['inspection', id],
  history:     (inspectionId?: string) => ['history', inspectionId],
}
```

Standards are fetched only on `CreateInspection` page. `EditResult` never fetches standards — the standard is locked after creation.

### API Client
```typescript
getStandards(): Promise<Standard[]>
createInspection(payload: CreateInspectionPayload): Promise<Inspection>
getInspection(id: string): Promise<Inspection>
updateInspection(id: string, payload: UpdateInspectionPayload): Promise<Inspection>
getHistory(inspectionId?: string): Promise<HistoryListItem[]>
deleteHistory(ids: string[]): Promise<void>
```

---

## 5. Data Flow

### Create Inspection
```
User fills form → zod validates
  → if file uploaded: FileReader parses .json → rawData in payload
  → POST /api/history
    → backend fetches raw.json (or uses rawData)
    → loads standard by standardId
    → inspectionService.calculate() → { composition, defects, totalSample }
    → save to SQLite → return Inspection
  → invalidate ['history'] cache
  → navigate to /result/:id
```

### View Result
```
/result/:id mounts
  → useQuery(['inspection', id]) → GET /api/history/:id
  → render BasicInfo + CompositionTable + DefectTable
```

### Edit Result
```
User edits form → zod validates (editInspectionSchema)
  → PUT /api/history/:id
    → backend updates record → return updated Inspection
  → invalidate ['inspection', id] cache
  → navigate to /result/:id
```

### History List
```
/history mounts
  → useQuery(['history', undefined]) → GET /api/history
  → render HistoryListItem table

Search: user types ID → clicks Search
  → useQuery(['history', inspectionId]) → GET /api/history?inspectionId=xxx
  → partial match filter on backend → re-renders table

Delete: user selects rows → clicks Delete
  → DELETE /api/history { ids: [...] }
  → invalidate ['history'] cache → table re-fetches
```

### Standards Dropdown (Create only)
```
CreateInspection mounts
  → useQuery(['standards']) → GET /api/standard
  → cached indefinitely — no re-fetch on subsequent visits
```

---

## 6. Optional Upgrade Path (if time permits)

- Swap SQLite driver for `pg` (PostgreSQL)
- Add `docker-compose.yml` with postgres service
- No other changes needed — the repo layer abstracts the DB

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Monorepo structure | Option B (apps + shared package) | Shared types prevent FE/BE drift |
| Package manager | pnpm workspaces | Efficient, clean monorepo support |
| Frontend framework | Vite + React + TS | Fast dev, no SSR needed |
| Backend framework | Express + TS | Simple, widely understood |
| Database | SQLite (optional Postgres) | Zero setup for exam, upgrade path exists |
| ID generation | nanoid | Shorter, cleaner in UI than uuid |
| Form validation | react-hook-form + zod | Schema-driven, less boilerplate |
| State/caching | React Query | Solves caching without manual boilerplate |
| History search | `?inspectionId=` partial match only | Better UX than exact-match `/history/:id` |
| Standards on Edit | Not fetched | Standard locked after creation |
| Unmatched grains | Skip but count in totalWeight | No silent percentage inflation |
