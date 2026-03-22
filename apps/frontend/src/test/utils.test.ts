import { describe, it, expect } from 'vitest'
import type { CompositionRow } from '@easyrice/shared'

// ── Replicated pure helpers (same logic as in the pages) ─────────────────────

function formatSamplingPoint(points?: string[]) {
  if (!points || points.length === 0) return '-'
  return points.join(', ')
}

function formatLength(row: CompositionRow) {
  if (row.maxLength >= 50) return `>= ${row.minLength}`
  const displayMax =
    row.conditionMax === 'LT'
      ? Math.round((row.maxLength - 0.01) * 100) / 100
      : row.maxLength
  return `${row.minLength} - ${displayMax}`
}

function makeRow(overrides: Partial<CompositionRow> = {}): CompositionRow {
  return {
    key: 'wholegrain', name: 'Whole Grain',
    minLength: 7, maxLength: 99,
    conditionMin: 'GT', conditionMax: 'LT',
    actualPercent: 0, actualWeight: 0,
    ...overrides,
  }
}

// ── formatSamplingPoint ───────────────────────────────────────────────────────

describe('formatSamplingPoint', () => {
  it('returns "-" for undefined', () => {
    expect(formatSamplingPoint(undefined)).toBe('-')
  })

  it('returns "-" for empty array', () => {
    expect(formatSamplingPoint([])).toBe('-')
  })

  it('returns single point as-is', () => {
    expect(formatSamplingPoint(['Front End'])).toBe('Front End')
  })

  it('joins multiple points with ", "', () => {
    expect(formatSamplingPoint(['Front End', 'Back End'])).toBe('Front End, Back End')
  })

  it('joins all three sampling points', () => {
    expect(formatSamplingPoint(['Front End', 'Back End', 'Other'])).toBe('Front End, Back End, Other')
  })
})

// ── formatLength ──────────────────────────────────────────────────────────────

describe('formatLength', () => {
  it('shows ">= minLength" when maxLength >= 50 (whole grain)', () => {
    expect(formatLength(makeRow({ minLength: 7, maxLength: 99 }))).toBe('>= 7')
  })

  it('shows ">= minLength" for any maxLength >= 50', () => {
    expect(formatLength(makeRow({ minLength: 6, maxLength: 50 }))).toBe('>= 6')
  })

  it('subtracts 0.01 from maxLength when conditionMax is LT (broken range)', () => {
    expect(formatLength(makeRow({ minLength: 3.5, maxLength: 7, conditionMax: 'LT' }))).toBe('3.5 - 6.99')
  })

  it('uses maxLength as-is when conditionMax is LE', () => {
    expect(formatLength(makeRow({ minLength: 3.5, maxLength: 7, conditionMax: 'LE' }))).toBe('3.5 - 7')
  })

  it('handles zero minLength (small broken grain)', () => {
    expect(formatLength(makeRow({ minLength: 0, maxLength: 3.5, conditionMax: 'LT' }))).toBe('0 - 3.49')
  })

  it('rounds display max to 2 decimal places', () => {
    expect(formatLength(makeRow({ minLength: 0, maxLength: 4.5, conditionMax: 'LT' }))).toBe('0 - 4.49')
  })
})
