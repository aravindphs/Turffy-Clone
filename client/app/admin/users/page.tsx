'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SearchIcon from '@mui/icons-material/Search'
import { adminApi } from '@/lib/api'
import { UserTable } from '@/components/admin/UserTable'
import { PageSpinner } from '@/components/ui/Spinner'

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: async () => {
      const res = await adminApi.getAllUsers({ role: roleFilter || undefined, limit: 100 })
      return res.data
    },
  })

  const users = (data?.data || []).filter((u) =>
    search
      ? u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      : true
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fontSize="small" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: '', label: 'All Roles' },
            { value: 'user', label: 'Users' },
            { value: 'owner', label: 'Owners' },
            { value: 'admin', label: 'Admins' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={[
                'px-3.5 py-2 rounded-xl text-sm font-medium border transition-all',
                roleFilter === opt.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 text-sm text-slate-500">
        {users.length} user{users.length !== 1 ? 's' : ''} found
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <UserTable users={users} />
      )}
    </div>
  )
}
