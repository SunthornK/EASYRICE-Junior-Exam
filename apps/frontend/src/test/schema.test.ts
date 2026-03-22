import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Same schema used in CreatePage and EditPage
const priceSchema = z.literal('').or(
  z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Numbers only, up to 2 decimal places')
    .refine(v => Number(v) >= 0 && Number(v) <= 100000, 'Price must be between 0 and 100,000')
).optional()

const createSchema = z.object({
  name: z.string().min(1, 'required'),
  standardId: z.string().min(1, 'required'),
  note: z.string().optional(),
  price: priceSchema,
  samplingPoints: z.array(z.string()).optional(),
  samplingDate: z.string().optional(),
})

// ── name validation ───────────────────────────────────────────────────────────

describe('CreatePage schema — name', () => {
  it('rejects empty name', () => {
    expect(createSchema.safeParse({ name: '', standardId: 'std-1' }).success).toBe(false)
  })

  it('accepts valid name', () => {
    expect(createSchema.safeParse({ name: 'Batch A', standardId: 'std-1' }).success).toBe(true)
  })
})

// ── standardId validation ─────────────────────────────────────────────────────

describe('CreatePage schema — standardId', () => {
  it('rejects empty standardId', () => {
    expect(createSchema.safeParse({ name: 'Test', standardId: '' }).success).toBe(false)
  })

  it('accepts valid standardId', () => {
    expect(createSchema.safeParse({ name: 'Test', standardId: '1' }).success).toBe(true)
  })
})

// ── price validation ──────────────────────────────────────────────────────────

describe('CreatePage schema — price', () => {
  it('accepts empty string (price omitted)', () => {
    const result = priceSchema.safeParse('')
    expect(result.success).toBe(true)
  })

  it('accepts valid integer price', () => {
    expect(priceSchema.safeParse('1000').success).toBe(true)
  })

  it('accepts price with 2 decimal places', () => {
    expect(priceSchema.safeParse('99.99').success).toBe(true)
  })

  it('accepts boundary value 0', () => {
    expect(priceSchema.safeParse('0').success).toBe(true)
  })

  it('accepts boundary value 100000', () => {
    expect(priceSchema.safeParse('100000').success).toBe(true)
  })

  it('rejects price above 100000', () => {
    expect(priceSchema.safeParse('100001').success).toBe(false)
  })

  it('rejects negative price', () => {
    expect(priceSchema.safeParse('-1').success).toBe(false)
  })

  it('rejects more than 2 decimal places', () => {
    expect(priceSchema.safeParse('10.999').success).toBe(false)
  })

  it('rejects non-numeric string', () => {
    expect(priceSchema.safeParse('abc').success).toBe(false)
  })

  it('rejects price with comma separator', () => {
    expect(priceSchema.safeParse('10,000').success).toBe(false)
  })
})
