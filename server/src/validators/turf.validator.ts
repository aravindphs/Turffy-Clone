import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;
const pincodeRegex = /^\d{6}$/;

const peakHourSchema = z.object({
  start: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
  end: z.string().regex(timeRegex, 'End time must be in HH:mm format'),
  multiplier: z.number().min(1, 'Multiplier must be >= 1').max(5, 'Multiplier cannot exceed 5'),
});

const courtInputSchema = z.object({
  name: z.string().trim().min(1, 'Court name is required').max(80),
  sport: z.string().trim().min(1, 'Sport is required').toLowerCase(),
  description: z.string().trim().max(500).optional(),
});

export const createTurfSchema = z.object({
  name: z
    .string({ required_error: 'Turf name is required' })
    .trim()
    .min(3, 'Turf name must be at least 3 characters')
    .max(100),
  description: z
    .string({ required_error: 'Description is required' })
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000),
  address: z.string({ required_error: 'Address is required' }).trim().min(10).max(300),
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(2)
    .max(100)
    .toLowerCase(),
  state: z.string().trim().max(100).default('Tamil Nadu'),
  pincode: z.string().regex(pincodeRegex, 'Pincode must be 6 digits'),
  latitude: z
    .number({ required_error: 'Latitude is required' })
    .min(-90)
    .max(90),
  longitude: z
    .number({ required_error: 'Longitude is required' })
    .min(-180)
    .max(180),
  amenities: z.array(z.string().trim()).default([]),
  sports: z
    .array(z.string().trim().toLowerCase())
    .min(1, 'At least one sport is required'),
  operatingHours: z.object({
    open: z.string().regex(timeRegex, 'Opening time must be in HH:mm format'),
    close: z.string().regex(timeRegex, 'Closing time must be in HH:mm format'),
  }),
  slotInterval: z.number().min(15).max(120).default(30),
  basePrice: z
    .number({ required_error: 'Base price is required' })
    .min(0, 'Price cannot be negative'),
  peakHours: z.array(peakHourSchema).default([]),
  courts: z.array(courtInputSchema).min(1, 'At least one court is required'),
});

export const updateTurfSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  description: z.string().trim().min(20).max(2000).optional(),
  address: z.string().trim().min(10).max(300).optional(),
  city: z.string().trim().min(2).max(100).toLowerCase().optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().regex(pincodeRegex).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  amenities: z.array(z.string().trim()).optional(),
  sports: z.array(z.string().trim().toLowerCase()).min(1).optional(),
  operatingHours: z
    .object({
      open: z.string().regex(timeRegex),
      close: z.string().regex(timeRegex),
    })
    .optional(),
  slotInterval: z.number().min(15).max(120).optional(),
  basePrice: z.number().min(0).optional(),
  peakHours: z.array(peakHourSchema).optional(),
});

export const blockSlotSchema = z.object({
  courtId: z
    .string({ required_error: 'Court ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid court ID'),
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format'),
  reason: z.enum(['offline_booking', 'maintenance', 'other']).default('offline_booking'),
  notes: z.string().trim().max(500).optional(),
});

export const bulkBlockSlotSchema = z.object({
  courtId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z
    .array(
      z.object({
        startTime: z.string().regex(timeRegex),
        endTime: z.string().regex(timeRegex),
      })
    )
    .min(1, 'At least one slot is required'),
  reason: z.enum(['offline_booking', 'maintenance', 'other']).default('other'),
  notes: z.string().trim().max(500).optional(),
});

export const updatePricingSchema = z.object({
  basePrice: z.number().min(0).optional(),
  peakHours: z.array(peakHourSchema).optional(),
});

export const updateOperatingHoursSchema = z.object({
  open: z.string().regex(timeRegex, 'Opening time must be in HH:mm format'),
  close: z.string().regex(timeRegex, 'Closing time must be in HH:mm format'),
});

export type CreateTurfInput = z.infer<typeof createTurfSchema>;
export type UpdateTurfInput = z.infer<typeof updateTurfSchema>;
export type BlockSlotInput = z.infer<typeof blockSlotSchema>;
export type BulkBlockSlotInput = z.infer<typeof bulkBlockSlotSchema>;
