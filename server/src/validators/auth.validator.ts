import { z } from 'zod';

export const googleLoginSchema = z.object({
  googleToken: z.string({ required_error: 'Google token is required' }).min(1),
  role: z.enum(['user', 'owner']).default('user'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number')
    .optional(),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
