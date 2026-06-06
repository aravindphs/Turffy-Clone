'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GrassIcon from '@mui/icons-material/Grass'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import StarIcon from '@mui/icons-material/Star'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import EditIcon from '@mui/icons-material/Edit'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { useAuthStore } from '@/store/auth.store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
  { label: 'My Turf', href: '/turf', icon: GrassIcon },
  { label: 'Edit Turf', href: '/turf/edit', icon: EditIcon },
  { label: 'Slot Management', href: '/slots', icon: EventAvailableIcon },
  { label: 'Bookings', href: '/bookings', icon: BookOnlineIcon },
  { label: 'Reviews', href: '/reviews', icon: StarIcon },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <SportsSoccerIcon className="text-white" fontSize="small" />
          </div>
          <span className="text-lg font-bold text-white">Turffy</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <CloseIcon />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} alt={user?.name || 'Owner'} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <Badge variant="green" size="sm">Owner</Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              ].join(' ')}
            >
              <Icon fontSize="small" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/turfs"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          ← Back to Site
        </Link>
      </div>
    </div>
  )
}

export function OwnerSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-slate-900 min-h-screen fixed left-0 top-0 bottom-0 z-30 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-xl border border-slate-700"
        onClick={() => setMobileOpen(true)}
      >
        <MenuIcon />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-slate-900 h-full z-10">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
