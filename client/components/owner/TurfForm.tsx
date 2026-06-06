'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { turfApi } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Turf, TurfAmenity, SportType } from '@/types'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import SaveIcon from '@mui/icons-material/Save'

const SPORTS: SportType[] = ['football', 'cricket', 'basketball', 'badminton', 'tennis', 'volleyball']
const AMENITIES: TurfAmenity[] = [
  'parking', 'changing_room', 'washroom', 'floodlight',
  'drinking_water', 'first_aid', 'cafeteria', 'equipment_rental',
  'ac', 'wifi', 'security', 'coaching',
]

const turfSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  address: z.string().min(10, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  sports: z.array(z.string()).min(1, 'Select at least one sport'),
  amenities: z.array(z.string()),
})

type TurfFormData = z.infer<typeof turfSchema>

interface TurfFormProps {
  turf?: Turf
}

export function TurfForm({ turf }: TurfFormProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TurfFormData>({
    resolver: zodResolver(turfSchema),
    defaultValues: {
      name: turf?.name || '',
      description: turf?.description || '',
      address: turf?.location?.address || '',
      city: turf?.location?.city || '',
      pincode: turf?.location?.pincode || '',
      sports: turf?.sports || [],
      amenities: turf?.amenities || [],
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: TurfFormData) => {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v))
        } else {
          formData.append(key, value as string)
        }
      })

      if (turf) return turfApi.update(turf._id, formData)
      return turfApi.create(formData)
    },
    onSuccess: () => {
      toast.success(turf ? 'Turf updated!' : 'Turf created! Pending admin approval.')
      router.push('/turf')
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message || 'Failed to save turf.')
    },
  })

  const selectedSports = watch('sports') as string[]
  const selectedAmenities = watch('amenities') as string[]

  const toggleSport = (sport: string) => {
    const current = selectedSports
    if (current.includes(sport)) {
      setValue('sports', current.filter((s) => s !== sport))
    } else {
      setValue('sports', [...current, sport])
    }
  }

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities
    if (current.includes(amenity)) {
      setValue('amenities', current.filter((a) => a !== amenity))
    } else {
      setValue('amenities', [...current, amenity])
    }
  }

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Basic Information</h3>
        <Input
          label="Turf Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g., Green Fields Football Arena"
          required
        />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Describe your turf — facilities, location highlights, what makes it special..."
            className={[
              'w-full px-3 py-2.5 rounded-xl border text-sm resize-none',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
              errors.description ? 'border-red-400 bg-red-50' : 'border-slate-200',
            ].join(' ')}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Location</h3>
        <Input
          label="Full Address"
          {...register('address')}
          error={errors.address?.message}
          placeholder="Street, Area, Landmark"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            {...register('city')}
            error={errors.city?.message}
            placeholder="e.g., Chennai"
            required
          />
          <Input
            label="Pincode"
            {...register('pincode')}
            error={errors.pincode?.message}
            placeholder="600001"
            required
          />
        </div>
      </div>

      {/* Sports */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <h3 className="font-semibold text-slate-900">Sports Available</h3>
        {errors.sports && <p className="text-xs text-red-500">{errors.sports.message}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport)
            return (
              <button
                key={sport}
                type="button"
                onClick={() => toggleSport(sport)}
                className={[
                  'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                  isSelected
                    ? 'bg-brand-50 border-brand-400 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                {isSelected ? (
                  <CheckBoxIcon fontSize="small" className="text-brand-600" />
                ) : (
                  <CheckBoxOutlineBlankIcon fontSize="small" className="text-slate-400" />
                )}
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <h3 className="font-semibold text-slate-900">Amenities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity)
            const label = amenity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={[
                  'flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all',
                  isSelected
                    ? 'bg-brand-50 border-brand-400 text-brand-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300',
                ].join(' ')}
              >
                {isSelected ? (
                  <CheckBoxIcon fontSize="small" className="text-brand-600" />
                ) : (
                  <CheckBoxOutlineBlankIcon fontSize="small" className="text-slate-400" />
                )}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        leftIcon={<SaveIcon fontSize="small" />}
        isLoading={mutation.isPending}
      >
        {turf ? 'Save Changes' : 'Create Turf'}
      </Button>
    </form>
  )
}
