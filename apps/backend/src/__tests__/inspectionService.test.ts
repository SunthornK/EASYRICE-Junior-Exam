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
      { length: 6.0, weight: 0.01, shape: 'wholegrain', type: 'white' }, // excluded (not GT 6)
      { length: 7.0, weight: 0.01, shape: 'wholegrain', type: 'white' }, // included
      { length: 10.0, weight: 0.01, shape: 'wholegrain', type: 'white' }, // excluded (not LT 10)
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
