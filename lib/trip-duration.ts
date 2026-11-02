// Match the day marker, not the first number: 4N/5D is five days.
export function durationDays(label: string): number | null {
  const marked = label.match(/(\d+)\s*(?:days?\b|d\b)/i)
  if (marked) return Number(marked[1]) || null
  return /^\d+$/.test(label.trim()) ? Number(label) || null : null
}
