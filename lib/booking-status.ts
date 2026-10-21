export const bookingStatuses = ['pending', 'confirmed', 'cancelled'] as const
export type BookingStatus = typeof bookingStatuses[number]

export function isBookingStatus(value: unknown): value is BookingStatus {
  return bookingStatuses.includes(value as BookingStatus)
}

// Existing UI permits correcting confirmed/cancelled decisions. Pending cannot
// be restored via this workflow. Repeating a decision is an idempotent success.
export function canChangeBookingStatus(from: string, to: BookingStatus): boolean {
  return isBookingStatus(from) && (from === to || to === 'confirmed' || to === 'cancelled')
}
