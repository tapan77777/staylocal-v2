export const MAX_PEOPLE = 50
export const MIN_PEOPLE = 1

export function clampPeople(n: unknown): number {
  const raw = typeof n === 'number' ? n : parseInt(String(n ?? ''), 10)
  if (!Number.isFinite(raw)) return MIN_PEOPLE
  const i = Math.floor(raw)
  if (i < MIN_PEOPLE) return MIN_PEOPLE
  if (i > MAX_PEOPLE) return MAX_PEOPLE
  return i
}

export function calculatePackageTotal(priceAdult: number, people: number): number {
  const safePrice = Math.max(0, Math.floor(Number(priceAdult) || 0))
  const safePeople = clampPeople(people)
  return safePrice * safePeople
}

export function formatInr(amount: number): string {
  const n = Math.max(0, Math.floor(Number(amount) || 0))
  return `₹${n.toLocaleString('en-IN')}`
}
