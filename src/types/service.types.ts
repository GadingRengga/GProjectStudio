// src/types/service.types.ts

export interface Service {
  id: string
  code: string
  name: string
  description: string | null
  category: string | null
  unit: string | null
  basePrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateServiceDto {
  code: string
  name: string
  description?: string
  category?: string
  unit?: string
  basePrice: number
  isActive?: boolean
}

export type UpdateServiceDto = Partial<CreateServiceDto>