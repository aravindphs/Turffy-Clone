'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LockIcon from '@mui/icons-material/Lock'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid mobile number').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Enter current password'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  })

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data.data)
      queryClient.setQueryData(['me'], res.data.data)
      toast.success('Profile updated!')
    },
    onError: () => toast.error('Failed to update profile.'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      authApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully!')
      resetPassword()
    },
    onError: () => toast.error('Failed to change password.'),
  })

  const roleVariant = user?.role === 'admin' ? 'red' : user?.role === 'owner' ? 'orange' : 'blue'

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-16">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex items-center gap-5">
          <Avatar src={user?.avatar} alt={user?.name || 'User'} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="mt-2">
              <Badge variant={roleVariant} dot>
                {user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || '')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 mb-6">
          {[
            { key: 'profile', label: 'Profile', icon: <PersonIcon fontSize="small" /> },
            { key: 'security', label: 'Security', icon: <LockIcon fontSize="small" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'profile' | 'security')}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              ].join(' ')}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Personal Information</h2>
            <form
              onSubmit={handleProfile((data) => updateProfileMutation.mutate(data))}
              className="space-y-4"
            >
              <Input
                label="Full Name"
                {...regProfile('name')}
                error={profileErrors.name?.message}
                leftIcon={<PersonIcon fontSize="small" />}
                required
                fullWidth
              />
              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled
                leftIcon={<EmailIcon fontSize="small" />}
                helperText="Email cannot be changed"
                fullWidth
              />
              <Input
                label="Mobile Number"
                {...regProfile('phone')}
                error={profileErrors.phone?.message}
                placeholder="10-digit mobile number"
                leftIcon={<PhoneIcon fontSize="small" />}
                fullWidth
              />
              <Button
                type="submit"
                fullWidth
                isLoading={updateProfileMutation.isPending}
              >
                Save Changes
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Change Password</h2>
            <form
              onSubmit={handlePassword((data) => changePasswordMutation.mutate(data))}
              className="space-y-4"
            >
              <Input
                label="Current Password"
                type="password"
                {...regPassword('currentPassword')}
                error={passwordErrors.currentPassword?.message}
                leftIcon={<LockIcon fontSize="small" />}
                required
                fullWidth
              />
              <Input
                label="New Password"
                type="password"
                {...regPassword('newPassword')}
                error={passwordErrors.newPassword?.message}
                helperText="At least 8 characters"
                leftIcon={<LockIcon fontSize="small" />}
                required
                fullWidth
              />
              <Input
                label="Confirm New Password"
                type="password"
                {...regPassword('confirmPassword')}
                error={passwordErrors.confirmPassword?.message}
                leftIcon={<LockIcon fontSize="small" />}
                required
                fullWidth
              />
              <Button
                type="submit"
                fullWidth
                isLoading={changePasswordMutation.isPending}
              >
                Change Password
              </Button>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
