'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { turfApi } from '@/lib/api'
import { SportType, TurfAmenity } from '@/types'

// ─── Constants ──────────────────────────────────────────────────────────────────

const SPORTS: { key: SportType; label: string }[] = [
  { key: 'football', label: 'Football' },
  { key: 'cricket', label: 'Cricket' },
  { key: 'basketball', label: 'Basketball' },
  { key: 'badminton', label: 'Badminton' },
  { key: 'tennis', label: 'Tennis' },
  { key: 'volleyball', label: 'Volleyball' },
]

const AMENITIES: { key: TurfAmenity; label: string }[] = [
  { key: 'parking', label: 'Parking' },
  { key: 'floodlight', label: 'Floodlight' },
  { key: 'changing_room', label: 'Changing Room' },
  { key: 'cafeteria', label: 'Cafeteria' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'coaching', label: 'Coaching' },
  { key: 'washroom', label: 'Washroom' },
  { key: 'drinking_water', label: 'Drinking Water' },
  { key: 'first_aid', label: 'First Aid' },
  { key: 'equipment_rental', label: 'Equipment Rental' },
  { key: 'ac', label: 'AC' },
  { key: 'security', label: 'Security' },
]

const CITIES = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Vellore', 'Erode', 'Thanjavur', 'Tiruppur',
  'Tiruvannamalai', 'Karur', 'Namakkal', 'Dindigul', 'Kanchipuram',
  'Cuddalore', 'Nagercoil', 'Thoothukudi', 'Sivakasi', 'Ramanathapuram',
]

const SLOT_INTERVALS = [15, 30, 45, 60, 90]

// ─── Schema ──────────────────────────────────────────────────────────────────────

const wizardSchema = z.object({
  // Step 1
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  sports: z.array(z.string()).min(1, 'Select at least one sport'),

  // Step 2
  address: z.string().min(5, 'Enter a valid address'),
  city: z.string().min(1, 'Select a city'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  lat: z.string().optional(),
  lng: z.string().optional(),

  // Step 3
  openTime: z.string().min(1, 'Select opening time'),
  closeTime: z.string().min(1, 'Select closing time'),
  slotInterval: z.number().min(15),

  // Step 4
  basePrice: z.number().min(1, 'Enter a valid price'),
  amenities: z.array(z.string()),
  peakHours: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    multiplier: z.number().min(1).max(5),
  })),

  // Step 5
  courts: z.array(z.object({
    name: z.string().min(1, 'Court name is required'),
    sport: z.string().min(1, 'Select a sport'),
  })).min(1, 'Add at least one court'),
})

type WizardForm = z.infer<typeof wizardSchema>

// ─── STEPS ───────────────────────────────────────────────────────────────────────

const STEPS = [
  { title: 'Basic Info', desc: 'Name, description, sports' },
  { title: 'Location', desc: 'Address and coordinates' },
  { title: 'Hours & Slots', desc: 'Operating schedule' },
  { title: 'Pricing', desc: 'Base price and amenities' },
  { title: 'Courts', desc: 'Add your courts' },
]

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const { register, watch, setValue, formState: { errors } } = form
  const selectedSports = watch('sports') || []

  const toggleSport = (sport: string) => {
    const current = selectedSports
    setValue(
      'sports',
      current.includes(sport) ? current.filter((s) => s !== sport) : [...current, sport],
      { shouldValidate: true }
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Turf Name *</label>
        <input
          {...register('name')}
          placeholder="e.g. Green Arena Sports Complex"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Description *</label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="Tell players about your turf..."
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">Sports Available *</label>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSport(key)}
              className={[
                'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                selectedSports.includes(key)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.sports && <p className="text-xs text-red-500 mt-1">{errors.sports.message}</p>}
      </div>
    </div>
  )
}

function Step2({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const { register, setValue, formState: { errors } } = form
  const [geoLoading, setGeoLoading] = useState(false)

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('lat', pos.coords.latitude.toFixed(6))
        setValue('lng', pos.coords.longitude.toFixed(6))
        setGeoLoading(false)
      },
      () => {
        toast.error('Could not detect location')
        setGeoLoading(false)
      }
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Full Address *</label>
        <input
          {...register('address')}
          placeholder="123, Main Street, Area"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">City *</label>
          <select
            {...register('city')}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">Select city</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">Pincode *</label>
          <input
            {...register('pincode')}
            placeholder="600001"
            maxLength={6}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-slate-700">Coordinates (optional)</label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={geoLoading}
            className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
          >
            {geoLoading ? (
              <div className="h-3 w-3 border border-brand-400 border-t-brand-600 rounded-full animate-spin" />
            ) : (
              <GpsFixedIcon style={{ fontSize: 14 }} />
            )}
            Detect location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            {...register('lat')}
            placeholder="Latitude e.g. 13.0827"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input
            {...register('lng')}
            placeholder="Longitude e.g. 80.2707"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  )
}

function Step3({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const { register, watch, setValue, formState: { errors } } = form
  const slotInterval = watch('slotInterval')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">Opening Time *</label>
          <input
            type="time"
            {...register('openTime')}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.openTime && <p className="text-xs text-red-500 mt-1">{errors.openTime.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-1.5">Closing Time *</label>
          <input
            type="time"
            {...register('closeTime')}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.closeTime && <p className="text-xs text-red-500 mt-1">{errors.closeTime.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">Slot Duration (minutes) *</label>
        <div className="flex gap-2 flex-wrap">
          {SLOT_INTERVALS.map((interval) => (
            <button
              key={interval}
              type="button"
              onClick={() => setValue('slotInterval', interval, { shouldValidate: true })}
              className={[
                'px-4 py-2 rounded-xl border text-sm font-medium transition-colors',
                slotInterval === interval
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400',
              ].join(' ')}
            >
              {interval} min
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step4({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const { register, watch, setValue, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'peakHours' })
  const selectedAmenities = watch('amenities') || []

  const toggleAmenity = (amenity: string) => {
    const current = selectedAmenities
    setValue(
      'amenities',
      current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity]
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-1.5">Base Price per Slot (₹) *</label>
        <input
          type="number"
          {...register('basePrice', { valueAsNumber: true })}
          placeholder="e.g. 500"
          min={1}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-700">Peak Hours Pricing</label>
          <button
            type="button"
            onClick={() => append({ startTime: '18:00', endTime: '21:00', multiplier: 1.5 })}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <AddIcon style={{ fontSize: 16 }} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <input
                type="time"
                {...register(`peakHours.${i}.startTime`)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="time"
                {...register(`peakHours.${i}.endTime`)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                {...register(`peakHours.${i}.multiplier`, { valueAsNumber: true })}
                placeholder="1.5x"
                className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <DeleteIcon style={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No peak hours set. Click &quot;Add&quot; to add pricing tiers.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 block mb-2">Amenities</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleAmenity(key)}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors text-left',
                selectedAmenities.includes(key)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400',
              ].join(' ')}
            >
              {selectedAmenities.includes(key) && (
                <CheckCircleIcon style={{ fontSize: 14 }} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step5({ form }: { form: ReturnType<typeof useForm<WizardForm>> }) {
  const { register, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'courts' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Add the courts available at your turf.</p>
        <button
          type="button"
          onClick={() => append({ name: '', sport: 'football' })}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <AddIcon fontSize="small" /> Add Court
        </button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-400">No courts added yet.</p>
          <button
            type="button"
            onClick={() => append({ name: '', sport: 'football' })}
            className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            + Add your first court
          </button>
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Court Name</label>
                <input
                  {...register(`courts.${i}.name`)}
                  placeholder={`Court ${i + 1}`}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.courts?.[i]?.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.courts[i]?.name?.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Sport</label>
                <select
                  {...register(`courts.${i}.sport`)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {SPORTS.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="mt-7 text-red-400 hover:text-red-600 transition-colors"
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        ))}
      </div>
      {errors.courts && !Array.isArray(errors.courts) && (
        <p className="text-xs text-red-500">{errors.courts.message}</p>
      )}
    </div>
  )
}

function ReviewStep({ data }: { data: WizardForm }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-slate-900">Basic Info</h4>
        <p><span className="text-slate-500">Name:</span> {data.name}</p>
        <p><span className="text-slate-500">Sports:</span> {data.sports.join(', ')}</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-slate-900">Location</h4>
        <p><span className="text-slate-500">Address:</span> {data.address}</p>
        <p><span className="text-slate-500">City:</span> {data.city}, {data.pincode}</p>
        {data.lat && data.lng && (
          <p><span className="text-slate-500">Coordinates:</span> {data.lat}, {data.lng}</p>
        )}
      </div>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-slate-900">Hours & Slots</h4>
        <p><span className="text-slate-500">Hours:</span> {data.openTime} – {data.closeTime}</p>
        <p><span className="text-slate-500">Slot Duration:</span> {data.slotInterval} min</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-slate-900">Pricing</h4>
        <p><span className="text-slate-500">Base Price:</span> ₹{data.basePrice}/slot</p>
        <p><span className="text-slate-500">Amenities:</span> {data.amenities.length > 0 ? data.amenities.join(', ') : 'None'}</p>
        {data.peakHours.length > 0 && (
          <p><span className="text-slate-500">Peak Hours:</span> {data.peakHours.length} configured</p>
        )}
      </div>
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <h4 className="font-semibold text-slate-900">Courts ({data.courts.length})</h4>
        {data.courts.map((c, i) => (
          <p key={i}><span className="text-slate-500">Court {i + 1}:</span> {c.name} ({c.sport})</p>
        ))}
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function NewTurfPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      sports: [],
      amenities: [],
      peakHours: [],
      courts: [{ name: 'Court 1', sport: 'football' }],
      slotInterval: 60,
    },
  })

  const { handleSubmit, trigger } = form

  const STEP_FIELDS: Record<number, (keyof WizardForm)[]> = {
    1: ['name', 'description', 'sports'],
    2: ['address', 'city', 'pincode'],
    3: ['openTime', 'closeTime', 'slotInterval'],
    4: ['basePrice'],
    5: ['courts'],
  }

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step])
    if (valid) setStep((s) => Math.min(s + 1, 6))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const onSubmit = async (data: WizardForm) => {
    setIsSubmitting(true)
    try {
      // Build FormData for turf creation
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('sports', JSON.stringify(data.sports))
      formData.append('address', data.address)
      formData.append('city', data.city)
      formData.append('pincode', data.pincode)
      if (data.lat) formData.append('lat', data.lat)
      if (data.lng) formData.append('lng', data.lng)
      formData.append('openTime', data.openTime)
      formData.append('closeTime', data.closeTime)
      formData.append('slotInterval', String(data.slotInterval))
      formData.append('basePrice', String(data.basePrice))
      formData.append('amenities', JSON.stringify(data.amenities))
      formData.append('peakHours', JSON.stringify(data.peakHours))
      formData.append('courts', JSON.stringify(data.courts))

      await turfApi.create(formData)
      toast.success('Turf created successfully! Pending approval.')
      router.replace('/turf')
    } catch {
      toast.error('Failed to create turf. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (step / 5) * 100

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Create New Turf</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Step {Math.min(step, 5)} of 5 — {STEPS[Math.min(step, 5) - 1]?.title}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
        <div
          className="bg-brand-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 min-w-fit">
            <div
              className={[
                'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                step > i + 1
                  ? 'bg-brand-600 text-white'
                  : step === i + 1
                  ? 'bg-brand-100 text-brand-700 border-2 border-brand-600'
                  : 'bg-slate-100 text-slate-400',
              ].join(' ')}
            >
              {step > i + 1 ? <CheckCircleIcon style={{ fontSize: 16 }} /> : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                step >= i + 1 ? 'text-brand-600 font-medium' : 'text-slate-400'
              }`}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 ${step > i + 1 ? 'bg-brand-600' : 'bg-slate-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          {step <= 5 ? STEPS[step - 1].title : 'Review & Submit'}
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          {step <= 5 ? STEPS[step - 1].desc : 'Review all details before submitting'}
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && <Step1 form={form} />}
            {step === 2 && <Step2 form={form} />}
            {step === 3 && <Step3 form={form} />}
            {step === 4 && <Step4 form={form} />}
            {step === 5 && <Step5 form={form} />}
            {step === 6 && <ReviewStep data={form.getValues()} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              ← Back
            </button>
          )}
          {step < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : null}
              {isSubmitting ? 'Submitting...' : 'Submit Turf'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
