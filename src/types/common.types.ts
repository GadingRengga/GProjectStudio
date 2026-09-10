// src/types/common.types.ts
// Shared, provider-agnostic types used by every repository and composable.

export interface PaginationParams {
  page: number // starts at 1
  perPage: number // default 15
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}
