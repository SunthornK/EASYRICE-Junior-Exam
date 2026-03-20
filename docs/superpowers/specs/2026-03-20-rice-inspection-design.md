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
PUT    /history/:id           → update note/price/samplingPoint/samplingDate; sets updated_at = now
DELETE /history               → delete multiple inspections (body: { ids: string[] })
```

Note: `GET /standard` uses the singular form as specified in the Swagger contract.

### Startup Behavior
- Fetch and cache `standards.json` from S3 once at startup (URL from `STANDARDS_JSON_URL` env var)
- Run SQLite schema migrations on startup
- No runtime refresh of standards

### raw.json Fetch Strategy
- `raw.json` is fetched **per-request** (not cached), since it represents live sample data
- URL read from `RAW_JSON_URL` environment variable
- If the fetch fails, return HTTP 502 with `{ error: "Failed to fetch raw grain data" }`
- If the client uploads a file, the S3 fetch is skipped entirely

### File Upload Handling
- The frontend reads the `.json` file with `FileReader` and parses it as `RawGrain[]`
- The parsed array is embedded in the JSON body as `rawData` — `POST /history` always uses `Content-Type: application/json`
- No multipart/form-data upload
- The frontend validates the parsed file conforms to `RawGrain[]` before submission and shows an inline error if malformed
- The backend also validates `rawData` entries if present, returning HTTP 400 on invalid shape

### DELETE with Body
- `DELETE /history` sends `ids` in the JSON request body: `{ ids: string[] }`
- The `fetch` call sets `method: 'DELETE'`, `Content-Type: application/json`, and `body: JSON.stringify({ ids })`
- This is non-standard but supported by Express and the browser `fetch` API
- If proxy compatibility becomes a concern, switch to `POST /history/delete`

### Error Response Shape
All error responses use the shape `{ error: string }` with an appropriate HTTP status code:
- `400` — validation error
- `404` — record not found
- `502` — upstream fetch failure (S3/raw.json)
- `500` — unexpected server error

### SQLite Schema
```sql
CREATE TABLE inspections (
  id             TEXT PRIMARY KEY,   -- nanoid
  name           TEXT NOT NULL,
  standard_id    TEXT NOT NULL,
  standard_name  TEXT NOT NULL,
  note           TEXT,
  price          REAL,
  sampling_point TEXT,               -- JSON array string e.g. '["Front End","Back End"]'
  sampling_date  TEXT,               -- ISO string
  total_sample   INTEGER NOT NULL,
  composition    TEXT NOT NULL,      -- JSON string (CompositionRow[])
  defects        TEXT NOT NULL,      -- JSON string (DefectRow[])
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
```

JSON parse/stringify happens in the repo layer only — services always receive and return typed objects.

### Input Validation (Backend)
- `POST /history`: validate `name` (non-empty string), `standardId` (non-empty string), `price` (0–100000, 2 decimal places), `samplingPoint` (array of `'Front End' | 'Back End' | 'Other'`)
- `PUT /history/:id`: validate same optional fields

### Inspection Calculation (`inspectionService.ts`)
```
1. Receive grains (from uploaded rawData or fetched raw.json from S3)
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

**Shape matching:** `subStandard.shape` is an array and must be treated as a set. Use `subStandard.shape.includes(grain.shape)`. While current `standards.json` data has single-element shape arrays, multiple shapes per subStandard are valid and must work correctly.

**Defect type display names:** The service uses a static lookup table to map `GrainType` to Thai display names:
```typescript
const DEFECT_NAMES: Record<GrainType, string> = {
  white:     'ข้าวขาว',
  yellow:    'ข้าวเหลือง',
  red:       'ข้าวแดง',
  damage:    'ข้าวเสีย',
  paddy:     'ข้าวเปลือก',
  chalky:    'ข้าวท้องไข่',
  glutinous: 'ข้าวเหนียว',
}
```
This lives in `services/inspectionService.ts`. It is not in `shared` because it is display logic, not a data contract.

**Unmatched grains:** Skipped from composition/defect assignment but included in totalWeight. Prevents silent percentage inflation.

**ID generation:** nanoid (shorter, cleaner in UI).

---

## 3. Shared Types (`packages/shared`)

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

// CompositionRow carries range fields (minLength, maxLength, conditionMin, conditionMax)
// because the Result page spec requires a "Length" column showing the range per subStandard.
// These are copied from SubStandard at calculation time and stored with the result.
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
  samplingPoint?: SamplingPoint[]
  samplingDate?: string
  totalSample: number
  composition: CompositionRow[]
  defects: DefectRow[]
  createdAt: string
  updatedAt: string
}

// Lightweight type for GET /history list — no composition/defects
// Intentionally omits price, samplingDate, samplingPoint (not needed in the list table)
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
  rawData?: RawGrain[]   // if absent, backend fetches from S3
}

export interface UpdateInspectionPayload {
  note?: string
  price?: number
  samplingPoint?: SamplingPoint[]
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
  // price: validate as string pattern first to avoid IEEE 754 floating-point issues,
  // then coerce to number. Use z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)
  // instead of z.number().multipleOf(0.01) to prevent spurious validation failures.
  price:          z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number)
                    .refine(n => n >= 0 && n <= 100000).optional(),
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
  standards:   ['standards'],                          // cached for session lifetime
  inspection:  (id: string) => ['inspection', id],
  history:     (inspectionId?: string) => ['history', inspectionId],
}
```

Standards are fetched only on `CreateInspection` page. `EditResult` never fetches standards — the standard is locked after creation.

**Known limitation:** Standards are cached for the browser session. A page reload is required to pick up new standards after a backend restart.

### API Client (`api/client.ts`)
Note: `getStandards()` calls `GET /api/standard` (singular — intentional per spec).

```typescript
getStandards(): Promise<Standard[]>           // → GET /api/standard
createInspection(payload: CreateInspectionPayload): Promise<Inspection>
getInspection(id: string): Promise<Inspection>
updateInspection(id: string, payload: UpdateInspectionPayload): Promise<Inspection>
getHistory(inspectionId?: string): Promise<HistoryListItem[]>
deleteHistory(ids: string[]): Promise<void>   // DELETE with JSON body
```

---

## 5. Data Flow

### Create Inspection
```
User fills form → zod validates
  → if file uploaded: FileReader parses .json → validate as RawGrain[] → show error if invalid
  → POST /api/history (Content-Type: application/json)
    → backend fetches raw.json from S3 (or uses rawData if provided)
    → loads standard by standardId
    → inspectionService.calculate() → { composition, defects, totalSample }
    → save to SQLite → return Inspection
  → queryClient.invalidateQueries({ queryKey: ['history'] })  // prefix invalidation, clears all history queries
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
    → backend updates record, sets updated_at = now → return updated Inspection
  → queryClient.invalidateQueries({ queryKey: ['inspection', id] })
  → queryClient.invalidateQueries({ queryKey: ['history'] })  // note is in HistoryListItem
  → navigate to /result/:id
```

### History List
```
/history mounts
  → useQuery(['history', undefined]) → GET /api/history
  → render HistoryListItem table

Search: user types ID → clicks Search
  → useQuery(['history', inspectionId]) → GET /api/history?inspectionId=xxx
  → partial match filter on backend using SQLite LIKE '%xxx%' → re-renders table
  → match is case-sensitive for non-ASCII; nanoid IDs are ASCII-only so LIKE is safe

Delete: user selects rows → clicks Delete
  → DELETE /api/history { ids: [...] } (JSON body)
  → queryClient.invalidateQueries({ queryKey: ['history'] })  // prefix invalidation, clears all history queries → table re-fetches
```

### Standards Dropdown (Create only)
```
CreateInspection mounts
  → useQuery(['standards']) → GET /api/standard
  → cached for session — no re-fetch on subsequent visits
```

---

## 6. Optional Upgrade Path (if time permits)

- Swap SQLite driver for `pg` (PostgreSQL)
- Add `docker-compose.yml` with postgres service
- No other changes needed — the repo layer abstracts the DB

---

## 7. Decisions Log

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
| File upload transport | JSON body with embedded `rawData` | Simpler than multipart; no binary data |
| DELETE body | JSON body with `ids` | Matches Swagger spec; supported by fetch + Express |
| `SamplingPoint` | Explicit union type | Enforces enum at both FE (zod) and BE (validation) |
