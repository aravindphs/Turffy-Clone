'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LockIcon from '@mui/icons-material/Lock'
import GrassIcon from '@mui/icons-material/Grass'
import SportsIcon from '@mui/icons-material/Sports'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'owner']),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth()
  const [role, setRole] = useState<'user' | 'owner'>('user')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'user' },
  })

  const handleRoleChange = (newRole: 'user' | 'owner') => {
    setRole(newRole)
    setValue('role', newRole)
  }

  const onSubmit = (data: RegisterForm) => {
    registerUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <SportsSoccerIcon className="text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Turffy</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join thousands of sports enthusiasts</p>
        </div>

        {/* Role Selector */}
        <div className="flex rounded-xl border border-slate-200 p-1 mb-6 bg-slate-50">
          {[
            { value: 'user', label: 'Player', icon: <SportsIcon fontSize="small" /> },
            { value: 'owner', label: 'Turf Owner', icon: <GrassIcon fontSize="small" /> },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleRoleChange(option.value as 'user' | 'owner')}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                role === option.value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} />

          <Input
            label="Full Name"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Your full name"
            leftIcon={<PersonIcon fontSize="small" />}
            required
            fullWidth
          />
          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="you@example.com"
            leftIcon={<EmailIcon fontSize="small" />}
            required
            fullWidth
          />
          <Input
            label="Mobile Number"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="10-digit mobile number"
            leftIcon={<PhoneIcon fontSize="small" />}
            required
            fullWidth
          />
          <Input
            label="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
            placeholder="Minimum 8 characters"
            leftIcon={<LockIcon fontSize="small" />}
            required
            fullWidth
          />
          <Input
            label="Confirm Password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="Repeat your password"
            leftIcon={<LockIcon fontSize="small" />}
            required
            fullWidth
          />

          {role === 'owner' && (
            <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-700">
              <p className="font-semibold mb-1">Turf Owner Registration</p>
              <p className="text-brand-600">
                Your account will be created as a turf owner. You can add your turf details after registration. Our team reviews all turf listings.
              </p>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isRegistering}
            className="mt-2"
          >
            {role === 'owner' ? 'Create Owner Account' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
