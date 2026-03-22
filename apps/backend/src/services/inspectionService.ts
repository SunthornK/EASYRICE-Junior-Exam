import type { RawGrain, Standard, CompositionRow, DefectRow, GrainType } from '@easyrice/shared'

// white is not a defect — it is the primary grain type
// Order and names match the design: yellow, paddy, damaged, glutinous, chalky, red
const DEFECT_NAMES: Partial<Record<GrainType, string>> = {
  yellow: 'yellow',
  paddy: 'paddy',
  damage: 'damaged',
  glutinous: 'glutinous',
  chalky: 'chalky',
  red: 'red',
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

  const defects: DefectRow[] = (Object.keys(DEFECT_NAMES) as GrainType[]).map(type => ({
    type,
    name: DEFECT_NAMES[type]!,
    actualPercent: totalWeight > 0 ? round2(((defectWeights[type] ?? 0) / totalWeight) * 100) : 0,
    actualWeight: round2(defectWeights[type] ?? 0),
  }))

  return { composition, defects, totalSample: grains.length }
}
