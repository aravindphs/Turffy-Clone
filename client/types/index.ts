// ─── User & Auth ───────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'owner' | 'admin'

export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  isVerified: boolean
  subscription?: {
    tier: 'free' | 'pro' | 'business'
    validUntil: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

// ─── Location & Cities ─────────────────────────────────────────────────────────

export interface Location {
  type: 'Point'
  coordinates: [number, number] // [lng, lat]
  address: string
  city: string
  state: string
  pincode: string
}

// ─── Turf & Courts ────────────────────────────────────────────────────────────

export type SportType =
  | 'football'
  | 'cricket'
  | 'basketball'
  | 'badminton'
  | 'tennis'
  | 'volleyball'
  | 'other'

export type TurfStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type TurfAmenity =
  | 'parking'
  | 'changing_room'
  | 'washroom'
  | 'floodlight'
  | 'drinking_water'
  | 'first_aid'
  | 'cafeteria'
  | 'equipment_rental'
  | 'ac'
  | 'wifi'
  | 'security'
  | 'coaching'

export interface PeakHour {
  startTime: string // 'HH:mm'
  endTime: string   // 'HH:mm'
  days: number[]    // 0=Sun, 1=Mon … 6=Sat
  priceMultiplier: number // e.g. 1.5 = 50% more
}

export interface OperatingHours {
  open: string  // 'HH:mm'
  close: string // 'HH:mm'
  days: number[] // days of week open
}

export interface Court {
  _id: string
  turfId: string
  name: string
  sport: SportType
  slotDurationMinutes: number // 30 | 60
  basePricePerSlot: number    // INR
  peakHours: PeakHour[]
  operatingHours: OperatingHours
  isActive: boolean
}

export interface Turf {
  _id: string
  name: string
  description: string
  owner: User | string
  location: Location
  images: string[]
  sports: SportType[]
  amenities: TurfAmenity[]
  courts: Court[]
  status: TurfStatus
  averageRating: number
  totalReviews: number
  totalBookings: number
  isFeatured?: boolean
  featuredUntil?: string | null
  createdAt: string
  updatedAt: string
}

// ─── Slots ─────────────────────────────────────────────────────────────────────

export type SlotStatus = 'available' | 'booked' | 'blocked' | 'selected' | 'peak'

export interface Slot {
  id: string           // composite: `${courtId}_${date}_${startTime}`
  courtId: string
  turfId: string
  date: string         // 'YYYY-MM-DD'
  startTime: string    // 'HH:mm'
  endTime: string      // 'HH:mm'
  status: SlotStatus
  price: number        // INR
  isPeak: boolean
  blockReason?: 'offline_booking' | 'maintenance'
  bookingId?: string
}

export interface BlockedSlot {
  _id: string
  turfId: string
  courtId: string
  date: string
  startTime: string
  endTime: string
  reason: 'offline_booking' | 'maintenance'
  createdBy: string
  createdAt: string
}

// ─── Booking ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'refunded'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface BookedSlotInfo {
  startTime: string
  endTime: string
}

export interface Booking {
  _id: string
  user: User | string
  turf: Turf | string
  court: Court | string
  date: string
  slots: BookedSlotInfo[]
  totalPrice: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentId?: string
  razorpayOrderId?: string
  cancellationReason?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

export interface Review {
  _id: string
  user: User | string
  turf: string
  booking: string
  rating: number     // 1–5
  comment: string
  images?: string[]
  ownerReply?: string
  createdAt: string
  updatedAt: string
}

// ─── Chat / Messages ───────────────────────────────────────────────────────────

export type MessageSenderRole = 'user' | 'owner'

export interface Message {
  _id: string
  bookingId: string
  sender: User | string
  senderRole: MessageSenderRole
  content: string
  isRead: boolean
  createdAt: string
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'new_message'
  | 'slot_reminder'
  | 'turf_approved'
  | 'review_received'

export interface Notification {
  _id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── API Helpers ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  message?: string
}

// ─── Filter / Search ───────────────────────────────────────────────────────────

export interface TurfFilters {
  city?: string
  sport?: SportType
  date?: string
  minPrice?: number
  maxPrice?: number
  amenities?: TurfAmenity[]
  lat?: number
  lng?: number
  radius?: number // km
  page?: number
  limit?: number
}

// ─── Admin Stats ───────────────────────────────────────────────────────────────

export interface PlatformStats {
  totalTurfs: number
  pendingTurfs: number
  totalUsers: number
  totalOwners: number
  totalBookings: number
  totalRevenue: number
  todayBookings: number
  todayRevenue: number
}

export interface OwnerStats {
  todayBookings: number
  weekRevenue: number
  totalBookings: number
  averageRating: number
  totalReviews: number
  upcomingBookings: Booking[]
  recentBookings: Booking[]
}

// ─── Razorpay ──────────────────────────────────────────────────────────────────

export interface RazorpayOrderResponse {
  orderId: string
  amount: number   // paise
  currency: string
  bookingId: string
  keyId: string
}

export interface RazorpaySuccessPayload {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

// ─── Open Match ────────────────────────────────────────────────────────────────

export type OpenMatchStatus = 'open' | 'full' | 'cancelled' | 'completed'
export type PlayerRequestStatus = 'pending' | 'approved' | 'rejected'

export interface OpenMatchPlayer {
  user: User | string
  status: PlayerRequestStatus
  joinedAt: string
}

export interface OpenMatch {
  _id: string
  turf: Turf | string
  court: Court | string
  booking: string
  organizer: User | string
  sport: SportType
  city: string
  date: string
  startTime: string
  endTime: string
  maxPlayers: number
  minPlayers: number
  players: OpenMatchPlayer[]
  status: OpenMatchStatus
  spotsLeft: number
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Socket Events ─────────────────────────────────────────────────────────────

export interface SlotUpdateEvent {
  turfId: string
  courtId: string
  date: string
  startTime: string
  endTime: string
  status: SlotStatus
  bookingId?: string
}

export interface TypingEvent {
  bookingId: string
  userId: string
  isTyping: boolean
}
