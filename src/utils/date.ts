// src/utils/date.ts
// Date formatters — Indonesian locale (docs/ARCHITECTURE.md folder structure).

function toDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDatetime(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function toISODate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toISOString().slice(0, 10)
}
