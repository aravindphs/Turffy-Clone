'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { authApi } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import { disconnectSocket } from '@/lib/socket'
import { useQueryClient } from '@tanstack/react-query'

export function Navbar() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const { notifications } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      queryClient.clear()
      disconnectSocket()
      toast.success('Logged out successfully')
      router.push('/login')
    }
  }

  const dashboardHref =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'owner'
      ? '/dashboard'
      : '/turfs'

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <SportsSoccerIcon className="text-white" fontSize="small" />
            </div>
            <span className="text-xl font-bold text-white">Turffy</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/turfs"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Browse Turfs
            </Link>
            {isAuthenticated && user?.role === 'user' && (
              <Link
                href="/bookings"
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                My Bookings
              </Link>
            )}
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative text-slate-300 hover:text-white transition-colors">
                  <NotificationsIcon fontSize="small" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 group"
                  >
                    <Avatar
                      src={user.avatar}
                      alt={user.name}
                      size="sm"
                      className="ring-2 ring-transparent group-hover:ring-brand-500 transition-all"
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden"
                        >
                          <div className="p-3 border-b border-slate-100">
                            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                          <div className="p-1.5">
                            <Link
                              href={dashboardHref}
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <DashboardIcon fontSize="small" className="text-slate-400" />
                              Dashboard
                            </Link>
                            {user.role === 'user' && (
                              <Link
                                href="/bookings"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                <BookOnlineIcon fontSize="small" className="text-slate-400" />
                                My Bookings
                              </Link>
                            )}
                            <Link
                              href="/profile"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <PersonIcon fontSize="small" className="text-slate-400" />
                              Profile
                            </Link>
                            {user.role === 'admin' && (
                              <Link
                                href="/admin/dashboard"
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                              >
                                <AdminPanelSettingsIcon fontSize="small" className="text-slate-400" />
                                Admin Panel
                              </Link>
                            )}
                          </div>
                          <div className="p-1.5 border-t border-slate-100">
                            <button
                              onClick={() => {
                                setProfileOpen(false)
                                handleLogout()
                              }}
                              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <LogoutIcon fontSize="small" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-slate-900 border-t border-slate-800"
          >
            <div className="px-4 py-3 flex flex-col gap-2">
              <Link
                href="/turfs"
                onClick={() => setMobileOpen(false)}
                className="text-slate-300 hover:text-white py-2 text-sm font-medium"
              >
                Browse Turfs
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="text-slate-300 hover:text-white py-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="text-slate-300 hover:text-white py-2 text-sm font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout() }}
                    className="text-red-400 hover:text-red-300 py-2 text-sm font-medium text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-slate-300 hover:text-white py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
