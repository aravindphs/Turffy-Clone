'use client'

import { motion } from 'framer-motion'
import { Slot } from '@/types'
import { Tooltip } from '@/components/ui/Tooltip'
import BlockIcon from '@mui/icons-material/Block'
import LockIcon from '@mui/icons-material/Lock'
import WhatshotIcon from '@mui/icons-material/Whatshot'

interface SlotCellProps {
  slot: Slot
  onToggle: (slot: Slot) => void
  disabled?: boolean
}

export function SlotCell({ slot, onToggle, disabled = false }: SlotCellProps) {
  const isInteractive = slot.status === 'available' || slot.status === 'selected'

  const getStyles = () => {
    switch (slot.status) {
      case 'available':
        return slot.isPeak
          ? 'bg-orange-50 border-orange-400 text-orange-700 hover:bg-orange-100 cursor-pointer'
          : 'bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
      case 'selected':
        return 'bg-indigo-600 border-indigo-600 text-white cursor-pointer shadow-sm'
      case 'booked':
        return 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
      case 'blocked':
        return 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
      default:
        return 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
    }
  }

  const getIcon = () => {
    if (slot.status === 'blocked') return <LockIcon style={{ fontSize: 12 }} />
    if (slot.status === 'booked') return <BlockIcon style={{ fontSize: 12 }} />
    if (slot.isPeak && slot.status === 'available') return <WhatshotIcon style={{ fontSize: 12 }} />
    return null
  }

  const getTooltip = () => {
    if (slot.status === 'blocked') {
      return slot.blockReason === 'maintenance' ? 'Maintenance' : 'Offline booking'
    }
    if (slot.status === 'booked') return 'Already booked'
    if (slot.isPeak) return `Peak Hour — ₹${slot.price}`
    return `₹${slot.price}`
  }

  const cell = (
    <motion.button
      whileHover={isInteractive && !disabled ? { scale: 1.05 } : {}}
      whileTap={isInteractive && !disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.1 }}
      onClick={() => isInteractive && !disabled && onToggle(slot)}
      disabled={!isInteractive || disabled}
      className={[
        'relative flex flex-col items-center justify-center p-2 rounded-lg border text-center',
        'transition-all duration-150',
        getStyles(),
        slot.status === 'blocked'
          ? 'after:content-[""] after:absolute after:inset-0 after:rounded-lg after:bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(148,163,184,0.3)_3px,rgba(148,163,184,0.3)_4px)]'
          : '',
      ].join(' ')}
      aria-label={`${slot.startTime} - ${slot.status}`}
    >
      <div className="flex items-center gap-0.5 text-[11px] font-semibold">
        {getIcon()}
        <span>{slot.startTime}</span>
      </div>
      <span className="text-[10px] font-medium opacity-75">₹{slot.price}</span>
    </motion.button>
  )

  return (
    <Tooltip content={getTooltip()} position="top">
      {cell}
    </Tooltip>
  )
}
