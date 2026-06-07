import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {
  ApiResponse,
  AuthResponse,
  Booking,
  BlockedSlot,
  Message,
  Notification,
  OwnerStats,
  PaginatedResponse,
  PlatformStats,
  RazorpayOrderResponse,
  RazorpaySuccessPayload,
  Review,
  Slot,
  Turf,
  TurfFilters,
  User,
} from '@/types'

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ───────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor (Token Refresh) ─────────────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(undefined)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError as AxiosError)
        // Redirect to login if refresh fails
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth APIs ────────────────────────────────────────────────────────────────

export const authApi = {
  googleAuth: (googleToken: string, role: 'user' | 'owner' = 'user') =>
    api.post<ApiResponse<AuthResponse>>('/auth/google', { googleToken, role }),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
  refreshToken: () => api.post<ApiResponse<null>>('/auth/refresh-token'),
  updateProfile: (data: FormData | Partial<User>) =>
    api.patch<ApiResponse<User>>('/auth/profile', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
}

// ─── Turf APIs ────────────────────────────────────────────────────────────────

export const turfApi = {
  getAll: (filters: TurfFilters = {}) =>
    api.get<PaginatedResponse<Turf>>('/turfs', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<Turf>>(`/turfs/${id}`),

  getNearby: (lat: number, lng: number, radius = 10) =>
    api.get<ApiResponse<Turf[]>>('/turfs/nearby', { params: { lat, lng, radius } }),

  create: (data: FormData) =>
    api.post<ApiResponse<Turf>>('/turfs', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: FormData) =>
    api.put<ApiResponse<Turf>>(`/turfs/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/turfs/${id}`),

  // Owner's turf
  getMyTurf: () =>
    api.get<ApiResponse<Turf>>('/turfs/my-turf'),

  // Admin
  approve: (id: string) =>
    api.put<ApiResponse<Turf>>(`/turfs/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.put<ApiResponse<Turf>>(`/turfs/${id}/reject`, { reason }),

  suspend: (id: string) =>
    api.put<ApiResponse<Turf>>(`/turfs/${id}/suspend`),
}

// ─── Slot APIs ─────────────────────────────────────────────────────────────────

export const slotApi = {
  getAvailability: (turfId: string, courtId: string, date: string) =>
    api.get<ApiResponse<Slot[]>>(`/slots/${turfId}/${courtId}/${date}`),

  blockSlot: (data: {
    turfId: string
    courtId: string
    date: string
    startTime: string
    endTime: string
    reason: 'offline_booking' | 'maintenance'
  }) => api.post<ApiResponse<BlockedSlot>>('/slots/block', data),

  unblockSlot: (slotId: string) =>
    api.delete<ApiResponse<null>>(`/slots/block/${slotId}`),

  blockRange: (data: {
    turfId: string
    courtId: string
    date: string
    startTime: string
    endTime: string
    reason: 'offline_booking' | 'maintenance'
  }) => api.post<ApiResponse<BlockedSlot[]>>('/slots/block-range', data),
}

// ─── Booking APIs ──────────────────────────────────────────────────────────────

export const bookingApi = {
  create: (data: {
    turfId: string
    courtId: string
    date: string
    slots: Array<{ startTime: string; endTime: string }>
  }) => api.post<ApiResponse<Booking>>('/bookings', data),

  getMyBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Booking>>('/bookings/my', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Booking>>(`/bookings/${id}`),

  cancel: (id: string, reason?: string) =>
    api.put<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason }),

  // Owner
  getTurfBookings: (params?: {
    status?: string
    date?: string
    page?: number
    limit?: number
  }) => api.get<PaginatedResponse<Booking>>('/bookings/turf', { params }),

  // Admin
  getAllBookings: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Booking>>('/bookings', { params }),
}

// ─── Payment APIs ─────────────────────────────────────────────────────────────

export const paymentApi = {
  createOrder: (bookingId: string) =>
    api.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', { bookingId }),

  verifyPayment: (data: RazorpaySuccessPayload & { bookingId: string }) =>
    api.post<ApiResponse<Booking>>('/payments/verify', data),

  refund: (bookingId: string) =>
    api.post<ApiResponse<null>>('/payments/refund', { bookingId }),
}

// ─── Review APIs ──────────────────────────────────────────────────────────────

export const reviewApi = {
  getTurfReviews: (turfId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Review>>(`/reviews/${turfId}`, { params }),

  create: (data: { turfId: string; bookingId: string; rating: number; comment: string }) =>
    api.post<ApiResponse<Review>>('/reviews', data),

  ownerReply: (reviewId: string, reply: string) =>
    api.put<ApiResponse<Review>>(`/reviews/${reviewId}/reply`, { reply }),

  delete: (reviewId: string) =>
    api.delete<ApiResponse<null>>(`/reviews/${reviewId}`),
}

// ─── Chat APIs ─────────────────────────────────────────────────────────────────

export const chatApi = {
  getMessages: (bookingId: string) =>
    api.get<ApiResponse<Message[]>>(`/chat/${bookingId}/messages`),

  sendMessage: (bookingId: string, content: string) =>
    api.post<ApiResponse<Message>>(`/chat/${bookingId}/messages`, { content }),

  markRead: (bookingId: string) =>
    api.put<ApiResponse<null>>(`/chat/${bookingId}/read`),
}

// ─── Notification APIs ────────────────────────────────────────────────────────

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  markRead: (id: string) =>
    api.put<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.put<ApiResponse<null>>('/notifications/read-all'),
}

// ─── Stats APIs ───────────────────────────────────────────────────────────────

export const statsApi = {
  ownerStats: () =>
    api.get<ApiResponse<OwnerStats>>('/stats/owner'),

  platformStats: () =>
    api.get<ApiResponse<PlatformStats>>('/stats/platform'),
}

// ─── Admin APIs ───────────────────────────────────────────────────────────────

export const adminApi = {
  getAllUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),

  toggleUserStatus: (userId: string) =>
    api.put<ApiResponse<User>>(`/admin/users/${userId}/toggle-status`),

  deleteUser: (userId: string) =>
    api.delete<ApiResponse<null>>(`/admin/users/${userId}`),

  getPendingTurfs: () =>
    api.get<ApiResponse<Turf[]>>('/admin/turfs/pending'),
}

// ─── Subscription APIs ───────────────────────────────────────────────────────

export const subscriptionApi = {
  getStatus: () => api.get('/subscription'),
  createOrder: (tier: 'pro' | 'business') =>
    api.post('/subscription/order', { tier }),
  verifyPayment: (data: {
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
    tier: 'pro' | 'business'
  }) => api.post('/subscription/verify', data),
}

export default api
