// src/types/customer.types.ts

export type CustomerType = 'company' | 'personal' | 'institute' | 'university' | 'bumn'

export interface Customer {
  id: string
  code: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  country: string | null
  province: string | null
  provinceId: string | null
  regency: string | null
  regencyId: string | null
  district: string | null
  districtId: string | null
  village: string | null
  villageId: string | null
  postalCode: string | null
  type: CustomerType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerDto {
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  country?: string
  province?: string
  provinceId?: string
  regency?: string
  regencyId?: string
  district?: string
  districtId?: string
  village?: string
  villageId?: string
  postalCode?: string
  type?: CustomerType
  isActive?: boolean
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>

export interface CustomerStats {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  companies: number
}

export interface MonthlyTrendPoint {
  label: string
  value: number
}
