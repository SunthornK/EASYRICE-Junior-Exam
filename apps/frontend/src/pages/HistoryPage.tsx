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
const ROWS_OPTIONS = [10, 20, 50]

export default function HistoryPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [inputs, setInputs] = useState(EMPTY_FILTERS)
  const [activeFilters, setActiveFilters] = useState<{ inspectionId?: string; fromDate?: string; toDate?: string }>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
    setCurrentPage(1)
  }

  function handleClear() {
    setInputs(EMPTY_FILTERS)
    setActiveFilters({})
    setSelected(new Set())
    setCurrentPage(1)
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(selected.size === pagedItems.length && pagedItems.length > 0
      ? new Set()
      : new Set(pagedItems.map(i => i.id)))
  }

  function handleDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} item(s)?`)) return
    deleteMutation.mutate(Array.from(selected))
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(items.length / rowsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * rowsPerPage
  const pagedItems = items.slice(startIdx, startIdx + rowsPerPage)

  function getPageNumbers() {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('...')
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
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
          <label className="block text-xs text-gray-500 mb-1">From Date</label>
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
            Selected: {selected.size} item{selected.size > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-150">
          <thead>
            <tr className="bg-[#0F954D] text-white text-left">
              <th className="px-3 py-2 w-10">
                <input
                  type="checkbox"
                  checked={pagedItems.length > 0 && pagedItems.every(i => selected.has(i.id))}
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
            ) : pagedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">No records found</td>
              </tr>
            ) : (
              pagedItems.map((item: HistoryListItem, idx: number) => (
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
          >
            {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-gray-400">
            {items.length === 0 ? '0' : `${startIdx + 1}–${Math.min(startIdx + rowsPerPage, items.length)}`} of {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          {getPageNumbers().map((p, i) =>
            p === '...'
              ? <span key={`ellipsis-${i}`} className="px-2">…</span>
              : <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded border text-sm ${safePage === p ? 'bg-[#0F954D] text-white border-[#0F954D]' : 'border-gray-300 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
          )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
