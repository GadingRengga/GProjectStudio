// src/repositories/interfaces/ICustomerRepository.ts
// This file is NEVER changed during database migration.
// It is the "contract" — any implementation must match this shape exactly.

import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerStats, MonthlyTrendPoint } from '@/types/customer.types'
import type { PaginatedResult, PaginationParams } from '@/types/common.types'

export interface ICustomerRepository {
  findAll(params: PaginationParams): Promise<PaginatedResult<Customer>>
  findById(id: string): Promise<Customer | null>
  findByCode(code: string): Promise<Customer | null>
  search(query: string): Promise<Customer[]>
  create(data: CreateCustomerDto): Promise<Customer>
  update(id: string, data: UpdateCustomerDto): Promise<Customer>
  delete(id: string): Promise<void>
  toggleActive(id: string, isActive: boolean): Promise<Customer>
  getStats(): Promise<CustomerStats>
  getMonthlyTrend(months?: number): Promise<MonthlyTrendPoint[]>
}
