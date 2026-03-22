import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchInspectionById } from '../api/inspection'
import type { CompositionRow, DefectRow } from '@easyrice/shared'

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.toLocaleDateString('th-TH')} - ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

function formatSamplingPoint(points?: string[]) {
  if (!points || points.length === 0) return '-'
  return points.join(', ')
}

function formatLength(row: CompositionRow) {
  if (row.maxLength >= 50) return `>= ${row.minLength}`
  const displayMax = row.conditionMax === 'LT'
    ? Math.round((row.maxLength - 0.01) * 100) / 100
    : row.maxLength
  return `${row.minLength} - ${displayMax}`
}

export default function ViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: inspection, isLoading, isError } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => fetchInspectionById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading...</div>
  if (isError || !inspection) return <div className="text-center py-20 text-red-500">Failed to load inspection.</div>

  return (
    <div className="flex justify-center px-2 pb-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Inspection</h1>

        {/* Two-column layout: left = image+buttons, right = all cards */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">

          {/* Left column: square image + buttons */}
          <div className="flex flex-row sm:flex-col items-center gap-3 sm:shrink-0 sm:w-48 mr-5">
            <div className="w-36 h-48 sm:w-60 sm:h-80 bg-gray-900 rounded overflow-hidden shrink-0 flex items-center justify-center">
              {inspection.imageURL
                ? <img src={inspection.imageURL} alt="Rice sample" className="w-full h-full object-contain" />
                : <span className="text-gray-500 text-xs">No image</span>
              }
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(-1)}
                className="px-3 sm:px-4 py-1.5 text-sm border border-gray-400 rounded text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => navigate(`/history/${id}/edit`)}
                className="px-3 sm:px-4 py-1.5 text-sm font-semibold bg-[#0F954D] hover:bg-[#0d8544] text-white rounded"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Right column: metadata + composition + defects */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Card 1: Tracking info */}
            <div className="border border-gray-200 rounded p-3 sm:p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Create Date - Time</p>
                <p className="font-medium text-xs sm:text-sm wrap-break-word">{formatDateTime(inspection.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Inspection ID</p>
                <p className="font-medium text-xs sm:text-sm break-all">{inspection.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Standard</p>
                <p className="font-medium text-xs sm:text-sm">{inspection.standardName ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Sample</p>
                <p className="font-medium text-xs sm:text-sm">{inspection.totalSample ?? 0} kernel</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Update Date - Time</p>
                <p className="font-medium text-xs sm:text-sm wrap-break-word">{formatDateTime(inspection.updatedAt)}</p>
              </div>
            </div>

            {/* Card 2: Optional / sampling info */}
            <div className="border border-gray-200 rounded p-3 sm:p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Note</p>
                <p className="font-medium text-xs sm:text-sm">{inspection.note || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="font-medium text-xs sm:text-sm">{inspection.price != null ? inspection.price.toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date/Time of Sampling</p>
                <p className="font-medium text-xs sm:text-sm">{formatDateTime(inspection.samplingDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Sampling Point</p>
                <p className="font-medium text-xs sm:text-sm">{formatSamplingPoint(inspection.samplingPoint)}</p>
              </div>
            </div>

            {/* Composition Table */}
            <div className="border border-gray-200 rounded overflow-hidden overflow-x-auto">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 font-semibold text-sm">Composition</div>
              <table className="w-full text-sm min-w-64">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs text-gray-600">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 text-right">Actual</th>
                    <th className="px-4 py-2 text-right">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {(inspection.composition ?? []).map((row: CompositionRow, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2 text-right text-[#0F954D]">{row.actualPercent?.toFixed(2) ?? '0.00'} %</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">{formatLength(row)}</td>
                    </tr>
                  ))}
                  {(!inspection.composition || inspection.composition.length === 0) && (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-400 text-xs">No composition data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Defect Table */}
            <div className="border border-gray-200 rounded overflow-hidden overflow-x-auto">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 font-semibold text-sm">Defect Rice</div>
              <table className="w-full text-sm min-w-48">
                <thead>
                  <tr className="bg-gray-100 text-left text-xs text-gray-600">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 text-right">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {(inspection.defects ?? []).map((row: DefectRow, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2 text-right text-[#0F954D]">{row.actualPercent?.toFixed(2) ?? '0.00'} %</td>
                    </tr>
                  ))}
                  {inspection.defects && inspection.defects.length > 0 && (
                    <tr className="border-t border-gray-200 font-semibold">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right text-[#0F954D]">
                        {inspection.defects.reduce((s: number, r: DefectRow) => s + (r.actualPercent ?? 0), 0).toFixed(2)} %
                      </td>
                    </tr>
                  )}
                  {(!inspection.defects || inspection.defects.length === 0) && (
                    <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-400 text-xs">No defect data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
