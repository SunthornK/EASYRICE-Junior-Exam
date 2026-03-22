# EasyRice — Junior Exam Project

A full-stack rice inspection web application built as a one-week junior developer exam. The system allows users to create, view, edit, and manage rice grain inspection records with automated composition and defect analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (via better-sqlite3) |
| Shared Types | `@easyrice/shared` workspace package |
| Forms | react-hook-form + zod validation |
| Data Fetching | TanStack React Query v5, axios |
| Testing | Vitest, Supertest (29 tests) |
| Package Manager | pnpm workspaces (monorepo) |

---

## Project Structure

```
EasyRice/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── db/       # SQLite schema + repository
│   │   │   ├── routes/   # REST API routes
│   │   │   ├── services/ # Business logic (calculation, standards)
│   │   │   └── __tests__ # Integration + unit tests
│   │   └── .env          # Environment variables
│   └── frontend/         # Vite + React SPA
│       └── src/
│           ├── api/      # axios API clients
│           ├── components/ # Layout, navbar
│           └── pages/    # History, Create, View, Edit pages
└── packages/
    └── shared/           # Shared TypeScript types
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

The `.env` file requires:

```env
STANDARDS_JSON_URL=https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/standards.json
RAW_JSON_URL=https://easyrice-es-trade-data.s3.ap-southeast-1.amazonaws.com/raw.json
PORT=3000
```

### 3. Build shared package

```bash
pnpm --filter @easyrice/shared build
```

### 4. Run development servers

Run both together (recommended):

```bash
pnpm dev
```

Or run separately:

```bash
# Backend only
pnpm --filter @easyrice/backend dev

# Frontend only
pnpm --filter @easyrice/frontend dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/standard` | List all rice standards |
| `GET` | `/history` | List all inspections (supports `inspectionId`, `fromDate`, `toDate` filters) |
| `GET` | `/history/:id` | Get inspection by ID |
| `POST` | `/history` | Create new inspection with calculation |
| `PUT` | `/history/:id` | Update inspection (note, price, samplingPoint, samplingDate) |
| `DELETE` | `/history` | Delete inspections by IDs `{ ids: string[] }` |

---

## Features

### History Page
- Table of all past inspections with date/time, ID, name, standard, note
- Search by Inspection ID (partial match)
- Filter by date range (From Date / To Date)
- Clear Filter button
- Pagination with rows-per-page selector (10 / 20 / 50)
- Checkbox-based bulk delete
- Click any row to view inspection details

### Create Inspection Page
- Required fields: Name, Standard (dropdown loaded from S3)
- Optional fields: Note, Price (0–100,000), Sampling Point (checkboxes), Date/Time of Sampling
- JSON file upload — extracts grain data and image URL from `{ requestID, imageURL, grains: [] }` format
- Falls back to fetching grain data from S3 (`RAW_JSON_URL`) if no file is uploaded
- Submit button disabled until Name is filled

### View Inspection Page
- Two-column layout: sample image (left) + all data cards (right)
- Card 1: Create/Update timestamps, Inspection ID, Standard, Total Sample
- Card 2: Note, Price, Sampling Date/Time, Sampling Point
- Composition table: grain categories with length ranges and percentages
- Defect table: 6 defect types (yellow, paddy, damaged, glutinous, chalky, red) always shown with total row
- Back and Edit navigation buttons

### Edit Inspection Page
- Pre-filled form with existing data
- Editable fields: Note, Price, Sampling Point, Date/Time of Sampling
- Non-editable: Name, Standard, composition/defect results
- "Update Changes" button saves and redirects to View page

---

## Inspection Calculation

When an inspection is created, the backend classifies each grain using the selected standard's rules:

```
grain.length = 8mm → matches "Whole Grain" (minLength: 7, maxLength: 99)
grain.length = 5mm → matches "Large Broken" (minLength: 3.5, maxLength: 7)
```

- **Composition** — grain weight bucketed by length range, reported as `%` of total weight
- **Defects** — grain weight grouped by type (yellow, red, paddy, damaged, glutinous, chalky), always 6 rows
- White rice is the primary type and is **not** counted as a defect

---

## Running Tests

Run all tests (backend + frontend):

```bash
pnpm test
```

Or run individually:

```bash
pnpm --filter @easyrice/backend test
pnpm --filter @easyrice/frontend test
```

### Backend — 29 tests across 3 suites
- `inspectionService.test.ts` — calculation logic unit tests
- `historyRepo.test.ts` — SQLite repository tests (in-memory DB)
- `routes.test.ts` — full HTTP integration tests

### Frontend — 31 tests across 3 suites
- `utils.test.ts` — pure utility functions (formatLength, formatSamplingPoint)
- `schema.test.ts` — zod form validation (name, standardId, price rules)
- `HistoryPage.test.tsx` — component rendering and UI interaction tests
