export type Condition = 'GT' | 'GE' | 'LT' | 'LE'
export type GrainShape = 'wholegrain' | 'broken'
export type GrainType = 'white' | 'yellow' | 'red' | 'damage' | 'paddy' | 'chalky' | 'glutinous' | 'undermilled'
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
  imageURL?: string
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
  imageURL?: string
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
