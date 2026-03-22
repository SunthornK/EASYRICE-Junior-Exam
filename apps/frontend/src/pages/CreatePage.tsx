import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchStandards, createInspection } from '../api/inspection'
import type { RawGrain, SamplingPoint } from '@easyrice/shared'

const schema = z.object({
  name: z.string().min(1, 'required'),
  standardId: z.string().min(1, 'required'),
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

export default function CreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rawData, setRawData] = useState<RawGrain[] | null>(null)
  const [imageURL, setImageURL] = useState<string | undefined>()
  const [fileError, setFileError] = useState('')

  const { data: standards = [] } = useQuery({
    queryKey: ['standards'],
    queryFn: fetchStandards,
    staleTime: Infinity,
  })

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      samplingDate: new Date().toISOString().slice(0, 16),
      samplingPoints: [],
    },
  })
  const nameValue = useWatch({ control, name: 'name' })

  const mutation = useMutation({
    mutationFn: createInspection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
      navigate(`/history/${data.id}`)
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setFileError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        const grains = Array.isArray(parsed) ? parsed : (parsed.grains ?? [])
        setRawData(grains)
        setImageURL(Array.isArray(parsed) ? undefined : parsed.imageURL)
      } catch {
        setFileError('Invalid JSON file')
        setRawData(null)
      }
    }
    reader.readAsText(file)
  }

  function onSubmit(values: FormValues) {
    const samplingPoint = (values.samplingPoints ?? []) as SamplingPoint[]
    mutation.mutate({
      name: values.name,
      standardId: values.standardId,
      imageURL,
      note: values.note || undefined,
      price: values.price ? Number(values.price) : undefined,
      samplingPoint: samplingPoint.length > 0 ? samplingPoint : undefined,
      samplingDate: values.samplingDate || undefined,
      rawData: rawData ?? [],
    })
  }

  return (
    <div className="flex justify-center px-2">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">Create Inspection</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
            <input
              {...register('name')}
              placeholder="Please Holder"
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">required</p>}
          </div>

          {/* Standard */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standard*</label>
            <select
              {...register('standardId')}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none bg-white ${errors.standardId ? 'border-red-500' : 'border-gray-300 focus:border-gray-500'}`}
            >
              <option value="">Please Select Standard</option>
              {standards.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.standardId && <p className="text-red-500 text-xs mt-1">required</p>}
          </div>

          {/* Upload File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
            <div
              className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-500 cursor-pointer hover:border-gray-400 flex items-center gap-2"
              onClick={() => fileRef.current?.click()}
            >
              <span className="flex-1 truncate">{fileName || 'Choose JSON file...'}</span>
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
            {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <input
              {...register('note')}
              placeholder="Please Holder"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              {...register('price')}
              placeholder="10,000"
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
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !nameValue?.trim()}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold bg-[#0F954D] hover:bg-[#0d8544] text-white rounded disabled:opacity-50"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-xs text-center">Failed to create. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  )
}
