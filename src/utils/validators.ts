// src/utils/validators.ts
// Shared form validators — pure functions, no Vue/Supabase dependencies.

export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export function isEmail(value: string | null | undefined): boolean {
  if (!value) return false
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return pattern.test(value.trim())
}

export function isPostalCode(value: string | null | undefined): boolean {
  if (!value) return false
  return /^[0-9]{5}$/.test(value.trim())
}

export function isPhone(value: string | null | undefined): boolean {
  if (!value) return false
  const digits = value.replace(/[^0-9+]/g, '')
  return digits.replace('+', '').length >= 7 && digits.replace('+', '').length <= 16
}

export function minLength(value: string | null | undefined, min: number): boolean {
  return (value ?? '').length >= min
}

export function isPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0
}

export function isNonNegativeNumber(value: number | null | undefined): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0
}
