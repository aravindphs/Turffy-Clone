'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { slotApi } from '@/lib/api'
import { getSocket, joinRoom, leaveRoom } from '@/lib/socket'
import { Slot, SlotStatus, SlotUpdateEvent } from '@/types'

interface UseTurfAvailabilityOptions {
  turfId: string
  courtId: string
  date: string
  enabled?: boolean
}

interface UseTurfAvailabilityReturn {
  slots: Slot[]
  isLoading: boolean
  error: Error | null
  selectedSlots: Slot[]
  toggleSlot: (slot: Slot) => void
  clearSelection: () => void
  totalPrice: number
}

export function useTurfAvailability({
  turfId,
  courtId,
  date,
  enabled = true,
}: UseTurfAvailabilityOptions): UseTurfAvailabilityReturn {
  const [slotMap, setSlotMap] = useState<Map<string, Slot>>(new Map())
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set())

  const {
    data: apiSlots,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['slots', turfId, courtId, date],
    queryFn: async () => {
      const res = await slotApi.getAvailability(turfId, courtId, date)
      return res.data.data
    },
    enabled: enabled && !!turfId && !!courtId && !!date,
    staleTime: 30_000, // 30 seconds
  })

  // Sync API data into slotMap
  useEffect(() => {
    if (apiSlots) {
      setSlotMap(new Map(apiSlots.map((s) => [s.id, s])))
      setSelectedSlotIds(new Set())
    }
  }, [apiSlots])

  // Socket real-time updates
  useEffect(() => {
    if (!turfId || !courtId || !date) return

    const room = `turf:${turfId}:${courtId}:${date}`
    const socket = getSocket()
    joinRoom(room)

    const handleSlotUpdate = (event: SlotUpdateEvent) => {
      if (event.turfId !== turfId || event.courtId !== courtId || event.date !== date) return

      const slotId = `${courtId}_${date}_${event.startTime}`

      setSlotMap((prev) => {
        const next = new Map(prev)
        const existing = next.get(slotId)
        if (existing) {
          next.set(slotId, { ...existing, status: event.status as SlotStatus })
        }
        return next
      })

      // Deselect if slot becomes unavailable
      if (event.status !== 'available') {
        setSelectedSlotIds((prev) => {
          const next = new Set(prev)
          next.delete(slotId)
          return next
        })
      }
    }

    socket.on('slot:blocked', handleSlotUpdate)
    socket.on('slot:booked', handleSlotUpdate)
    socket.on('slot:unblocked', handleSlotUpdate)

    return () => {
      leaveRoom(room)
      socket.off('slot:blocked', handleSlotUpdate)
      socket.off('slot:booked', handleSlotUpdate)
      socket.off('slot:unblocked', handleSlotUpdate)
    }
  }, [turfId, courtId, date])

  const toggleSlot = useCallback(
    (slot: Slot) => {
      if (slot.status !== 'available' && !selectedSlotIds.has(slot.id)) return

      setSelectedSlotIds((prev) => {
        const next = new Set(prev)
        if (next.has(slot.id)) {
          next.delete(slot.id)
        } else {
          next.add(slot.id)
        }
        return next
      })
    },
    [selectedSlotIds]
  )

  const clearSelection = useCallback(() => {
    setSelectedSlotIds(new Set())
  }, [])

  // Build final slots array with selected status overlay
  const slots: Slot[] = Array.from(slotMap.values()).map((slot) => {
    if (selectedSlotIds.has(slot.id) && slot.status === 'available') {
      return { ...slot, status: 'selected' as SlotStatus }
    }
    return slot
  })

  const selectedSlots = slots.filter((s) => selectedSlotIds.has(s.id))
  const totalPrice = selectedSlots.reduce((sum, s) => sum + s.price, 0)

  return {
    slots,
    isLoading,
    error: error as Error | null,
    selectedSlots,
    toggleSlot,
    clearSelection,
    totalPrice,
  }
}
