// src/composables/useRegion.ts
// Cascading region dropdowns (province → regency → district → village).
// Data source: GadingRengga Indonesia Region API
// (https://github.com/GadingRengga/Indonesia-Region-Api)
// Runtime fetches from the API with lazy-loading per hierarchy level.

import { ref } from 'vue'
import type { District, Province, Regency, Village } from '@/types/region.types'

const API_BASE = 'https://raw.githubusercontent.com/GadingRengga/Indonesia-Region-Api/main/data'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`)
  if (!res.ok) throw new Error(`Failed to load region data: ${path}`)
  return (await res.json()) as T
}

/**
 * Transform API response to match existing interfaces.
 * - kode (dot-separated) → id (concatenated, no dots)
 * - nama → name
 * - Extract parent IDs from the dot-separated code
 * - kodepos → postal_code
 */

interface RawRegion {
  kode: string
  nama: string
  kodepos?: string
}

function transformProvince(item: RawRegion): Province {
  return { id: item.kode, name: item.nama }
}

function transformRegency(item: RawRegion): Regency {
  // kode format: "11.01" → id: "1101", province_id: "11"
  const parts = item.kode.split('.')
  return { id: parts.join(''), province_id: parts[0], name: item.nama }
}

function transformDistrict(item: RawRegion): District {
  // kode format: "11.01.01" → id: "110101", regency_id: "1101"
  const parts = item.kode.split('.')
  return { id: parts.join(''), regency_id: parts.slice(0, 2).join(''), name: item.nama }
}

function transformVillage(item: RawRegion): Village {
  // kode format: "11.01.01.2015" → id: "1101012015", district_id: "110101"
  const parts = item.kode.split('.')
  return {
    id: parts.join(''),
    district_id: parts.slice(0, 3).join(''),
    name: item.nama,
    postal_code: item.kodepos || null,
  }
}

export function useRegion() {
  const provinces = ref<Province[]>([])
  const regencies = ref<Regency[]>([])
  const districts = ref<District[]>([])
  const villages = ref<Village[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loadedProvinces = ref(false)

  async function fetchProvinces(): Promise<void> {
    if (loadedProvinces.value) return
    loading.value = true
    error.value = null
    try {
      const raw = await fetchJson<RawRegion[]>('provinces.json')
      provinces.value = raw.map(transformProvince)
      loadedProvinces.value = true
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchRegencies(provinceId: string): Promise<void> {
    regencies.value = []
    districts.value = []
    villages.value = []
    if (!provinceId) return
    loading.value = true
    error.value = null
    try {
      const raw = await fetchJson<RawRegion[]>(`regencies/${provinceId}.json`)
      regencies.value = raw.map(transformRegency)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchDistricts(regencyId: string): Promise<void> {
    districts.value = []
    villages.value = []
    if (!regencyId) return
    // API file names use dot format: "1101" → "11.01"
    const dotCode = `${regencyId.slice(0, 2)}.${regencyId.slice(2)}`
    loading.value = true
    error.value = null
    try {
      const raw = await fetchJson<RawRegion[]>(`districts/${dotCode}.json`)
      districts.value = raw.map(transformDistrict)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchVillages(districtId: string): Promise<void> {
    villages.value = []
    if (!districtId) return
    // API file names use dot format: "110101" → "11.01.01"
    const dotCode = `${districtId.slice(0, 2)}.${districtId.slice(2, 4)}.${districtId.slice(4)}`
    loading.value = true
    error.value = null
    try {
      const raw = await fetchJson<RawRegion[]>(`villages/${dotCode}.json`)
      villages.value = raw.map(transformVillage)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function resetAll(): void {
    regencies.value = []
    districts.value = []
    villages.value = []
  }

  return {
    provinces,
    regencies,
    districts,
    villages,
    loading,
    error,
    fetchProvinces,
    fetchRegencies,
    fetchDistricts,
    fetchVillages,
    resetAll,
  }
}
