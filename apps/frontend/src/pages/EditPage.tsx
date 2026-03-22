import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { fetchInspectionById, updateInspection } from '../api/inspection'
import type { SamplingPoint } from '@easyrice/shared'

const schema = z.object({
  note: z.string().optional(),
  price: z.literal('').or(
    z.string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Numbers only, up to 2 decimal places')
      .refine(v => Number(v) >= 0 && Number(v) <= 100000, 'Price must be between 0 and 100,000')
  ).optional(),
  samplingPoints: z.array(z.string()).optional(),
  samplingDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const SAMPLING_OPTIONS: { value: SamplingPoint; label: string }[] = [
  { value: 'Front End', label: 'Front End' },
  { value: 'Back End', label: 'Back End' },
  { value: 'Other', label: 'Other' },
]

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => fetchInspectionById(id!),
    enabled: !!id,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (inspection) {
      reset({
        note: inspection.note ?? '',
        price: inspection.price != null ? String(inspection.price) : '',
        samplingPoints: inspection.samplingPoint ?? [],
        samplingDate: inspection.samplingDate
          ? new Date(inspection.samplingDate).toISOString().slice(0, 16)
          : '',
      })
    }
  }, [inspection, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const samplingPoint = (values.samplingPoints ?? []) as SamplingPoint[]
      return updateInspection(id!, {
        note: values.note || undefined,
        price: values.price ? Number(values.price) : undefined,
        samplingPoint: samplingPoint.length > 0 ? samplingPoint : undefined,
        samplingDate: values.samplingDate || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(`/history/${id}`)
    },
  })

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading...</div>

  return (
    <div className="flex justify-center px-2">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-lg p-6 sm:p-8">
        <h1 className="text-lg sm:text-2xl font-bold text-center mb-6 break-all">
          Edit Inspection ID : {id}
        </h1>

        <form onSubmit={handleSubmit(v => mutation.mutate(v))} noValidate className="space-y-4">
          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              {...register('note')}
              placeholder="Inspection Support"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              {...register('price')}
              placeholder="15,000"
              inputMode="decimal"
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${errors.price ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
          </div>

          {/* Sampling Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sampling Point</label>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              {SAMPLING_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.value}
                    {...register('samplingPoints')}
                    className="accent-[#0F954D]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Date/Time of Sampling */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date/Time of Sampling</label>
            <input
              {...register('samplingDate')}
              type="datetime-local"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/history/${id}`)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-[#0F954D] hover:bg-[#0d8544] text-white rounded disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Submit'}
            </button>
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-xs text-center">Failed to update. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  )
}
