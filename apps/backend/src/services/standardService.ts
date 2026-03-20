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
