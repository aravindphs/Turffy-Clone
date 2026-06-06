import { IPeakHour } from '../models/Turf.model';

export interface TimeSlot {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

/**
 * Convert HH:mm to total minutes from midnight.
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert total minutes from midnight to HH:mm format.
 */
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Generate all possible time slots for a day between openTime and closeTime.
 * @param openTime  "06:00"
 * @param closeTime "23:00"
 * @param intervalMinutes  e.g. 30
 */
export const generateSlots = (
  openTime: string,
  closeTime: string,
  intervalMinutes: number
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(openTime);
  const end = timeToMinutes(closeTime);

  while (current + intervalMinutes <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + intervalMinutes),
    });
    current += intervalMinutes;
  }

  return slots;
};

/**
 * Calculate the price for a slot, applying peak hour multipliers.
 * If a slot overlaps with a peak period, the highest multiplier wins.
 * @param startTime "18:00"
 * @param endTime   "18:30"
 * @param basePrice  e.g. 500
 * @param peakHours  array of { start, end, multiplier }
 */
export const calculateSlotPrice = (
  startTime: string,
  endTime: string,
  basePrice: number,
  peakHours: IPeakHour[]
): number => {
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  let multiplier = 1;

  for (const peak of peakHours) {
    const peakStart = timeToMinutes(peak.start);
    const peakEnd = timeToMinutes(peak.end);

    // Overlap check
    if (slotStart < peakEnd && slotEnd > peakStart) {
      if (peak.multiplier > multiplier) {
        multiplier = peak.multiplier;
      }
    }
  }

  return Math.round(basePrice * multiplier);
};

/**
 * Check whether a requested time slot overlaps with any existing occupied slots.
 * @param occupiedSlots  Array of already booked/blocked {startTime, endTime}
 * @param startTime      Requested slot start
 * @param endTime        Requested slot end
 */
export const isSlotAvailable = (
  occupiedSlots: TimeSlot[],
  startTime: string,
  endTime: string
): boolean => {
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);

  for (const slot of occupiedSlots) {
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Overlaps if not (req ends before slot starts OR req starts after slot ends)
    if (!(reqEnd <= slotStart || reqStart >= slotEnd)) {
      return false;
    }
  }

  return true;
};

/**
 * Calculate total duration in minutes between two HH:mm times.
 */
export const getDurationMinutes = (startTime: string, endTime: string): number => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

/**
 * Calculate total price for a multi-slot booking spanning startTime to endTime.
 * Splits the range into slotInterval chunks and prices each.
 */
export const calculateTotalPrice = (
  startTime: string,
  endTime: string,
  slotInterval: number,
  basePrice: number,
  peakHours: IPeakHour[]
): number => {
  const slots = generateSlots(startTime, endTime, slotInterval);
  return slots.reduce((total, slot) => {
    return total + calculateSlotPrice(slot.startTime, slot.endTime, basePrice, peakHours);
  }, 0);
};
