import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchHistory, deleteInspections } from '../api/inspection'
import type { HistoryListItem } from '@easyrice/shared'

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

const EMPTY_FILTERS = { inspectionId: '', fromDate: '', toDate: '' }

export default function HistoryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [inputs, setInputs] = useState(EMPTY_FILTERS)
  const [activeFilters, setActiveFilters] = useState<{ inspectionId?: string; fromDate?: string; toDate?: string }>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['history', activeFilters],
    queryFn: () => fetchHistory({
      inspectionId: activeFilters.inspectionId || undefined,
      fromDate: activeFilters.fromDate ? new Date(activeFilters.fromDate).toISOString() : undefined,
      toDate: activeFilters.toDate ? new Date(activeFilters.toDate + 'T23:59:59').toISOString() : undefined,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInspections,
    onSuccess: () => {
      setSelected(new Set())
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })

  function handleSearch() {
    setActiveFilters({
      inspectionId: inputs.inspectionId || undefined,
      fromDate: inputs.fromDate || undefined,
      toDate: inputs.toDate || undefined,
    })
    setSelected(new Set())
  }

  function handleClear() {
    setInputs(EMPTY_FILTERS)
    setActiveFilters({})
    setSelected(new Set())
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(selected.size === items.length && items.length > 0 ? new Set() : new Set(items.map(i => i.id)))
  }

  function handleDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} item(s)?`)) return
    deleteMutation.mutate(Array.from(selected))
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate('/create')}
          className="bg-[#0F954D] hover:bg-[#0d8544] text-white text-sm font-semibold px-4 py-2 rounded"
        >
          + Create Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end mb-2">
        <div className="w-full sm:w-auto">
          <label className="block text-xs text-gray-500 mb-1">ID</label>
          <input
            type="text"
            value={inputs.inspectionId}
            onChange={e => setInputs(p => ({ ...p, inspectionId: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search with ID"
            className="w-full sm:w-52 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs text-gray-500 mb-1">Form Date</label>
          <input
            type="date"
            value={inputs.fromDate}
            onChange={e => setInputs(p => ({ ...p, fromDate: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={inputs.toDate}
            onChange={e => setInputs(p => ({ ...p, toDate: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1 bg-[#0F954D] hover:bg-[#0d8544] text-white text-sm font-semibold px-4 py-2 rounded w-full sm:w-auto justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          Search
        </button>
      </div>

      <button onClick={handleClear} className="text-[#0F954D] text-xs hover:underline mb-4">
        Clear Filter
      </button>

      {/* Delete bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-1.5 rounded"
          >
            Delete
          </button>
          <span className="text-sm text-gray-600">
            Select Items: {selected.size} Item{selected.size > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Table — scrollable on mobile */}
      <div className="border border-gray-200 rounded overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-150">
          <thead>
            <tr className="bg-[#0F954D] text-white text-left">
              <th className="px-3 py-2 w-10">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  className="accent-white"
                />
              </th>
              <th className="px-3 py-2 whitespace-nowrap">Create Date - Time</th>
              <th className="px-3 py-2 whitespace-nowrap">Inspection ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Standard</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">No records found</td>
              </tr>
            ) : (
              items.map((item: HistoryListItem, idx: number) => (
                <tr
                  key={item.id}
                  className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${selected.has(item.id) ? 'bg-green-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleRow(item.id)}
                      className="accent-[#0F954D]"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={() => navigate(`/history/${item.id}`)}>
                    {formatDateTime(item.createdAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={() => navigate(`/history/${item.id}`)}>
                    {item.id}
                  </td>
                  <td className="px-3 py-2" onClick={() => navigate(`/history/${item.id}`)}>
                    {item.name}
                  </td>
                  <td className="px-3 py-2" onClick={() => navigate(`/history/${item.id}`)}>
                    {item.standardName ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-400" onClick={() => navigate(`/history/${item.id}`)}>
                    {item.note || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
        <span>1-{items.length} of {items.length}</span>
        <button className="px-1 hover:text-gray-700">{'<'}</button>
        <button className="px-1 hover:text-gray-700">{'>'}</button>
      </div>
    </div>
  )
}
