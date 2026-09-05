import { z } from "zod"


export const registerSchema = z.object({
  name: z.string().min(3).max(30),
  email: z.string().email(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  residency: z.enum(['Chhattisgarh', 'chattishgar'], {
    message: 'must be candidate from chattishgar'
  })
});
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});