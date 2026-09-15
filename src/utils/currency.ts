// src/utils/currency.ts
// Currency formatters — Indonesian locale (docs/ARCHITECTURE.md folder structure).

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Rp0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatUSD(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function parseCurrency(input: string): number {
  // Parses Indonesian-formatted currency: "Rp 1.234.567,89" -> 1234567.89
  const digitsOnly = input.replace(/[^0-9,-]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(digitsOnly)
  return Number.isNaN(parsed) ? 0 : parsed
}
