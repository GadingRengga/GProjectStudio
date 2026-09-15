// src/types/region.types.ts
// Indonesian administrative regions from GadingRengga Indonesia Region API.
// Runtime fetches directly from the API with lazy-loading per hierarchy level.
// Data source: Kepmendagri No. 300.2.2-2430 Tahun 2025 + kode pos BPS/Pos Indonesia

export interface Province {
  id: string
  name: string
}

export interface Regency {
  id: string
  province_id: string
  name: string
}

export interface District {
  id: string
  regency_id: string
  name: string
}

export interface Village {
  id: string
  district_id: string
  name: string
  postal_code: string | null
}
