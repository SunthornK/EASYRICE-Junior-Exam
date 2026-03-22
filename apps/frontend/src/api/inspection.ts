import api from './client'
import type { Standard, Inspection, HistoryListItem, CreateInspectionPayload, UpdateInspectionPayload } from '@easyrice/shared'

export async function fetchStandards(): Promise<Standard[]> {
  const { data } = await api.get('/standard')
  return data
}

export async function fetchHistory(params?: { inspectionId?: string; fromDate?: string; toDate?: string; }): Promise<HistoryListItem[]> {
  const { data } = await api.get('/history', { params })
  return data
}

export async function fetchInspectionById(id: string): Promise<Inspection> {
  const { data } = await api.get(`/history/${id}`)
  return data
}

export async function createInspection(payload: CreateInspectionPayload): Promise<Inspection> {
  const { data } = await api.post('/history', payload)
  return data
}

export async function updateInspection(id: string, payload: UpdateInspectionPayload): Promise<Inspection> {
  const { data } = await api.put(`/history/${id}`, payload)
  return data
}

export async function deleteInspections(ids: string[]): Promise<void> {
  await api.delete('/history', { data: { ids } })
}
