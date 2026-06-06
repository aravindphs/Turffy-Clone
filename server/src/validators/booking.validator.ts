import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createBookingSchema = z.object({
  turfId: z.string().regex(objectIdRegex, 'Invalid turf ID'),
  courtId: z.string().regex(objectIdRegex, 'Invalid court ID'),
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }, 'Booking date cannot be in the past'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format'),
  notes: z.string().trim().max(500).optional(),
}).refine(
  (data) => {
    const [sh, sm] = data.startTime.split(':').map(Number);
    const [eh, em] = data.endTime.split(':').map(Number);
    return eh * 60 + em > sh * 60 + sm;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(5, 'Cancellation reason must be at least 5 characters').max(500),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().regex(objectIdRegex, 'Invalid booking ID'),
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
