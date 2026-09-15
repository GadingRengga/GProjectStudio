// src/repositories/interfaces/IServiceRepository.ts
// This file is NEVER changed during database migration.
// It is the "contract" — any implementation must match this shape exactly.

import type { Service, CreateServiceDto, UpdateServiceDto } from '@/types/service.types'
import type { PaginatedResult, PaginationParams } from '@/types/common.types'

export interface IServiceRepository {
  findAll(params: PaginationParams): Promise<PaginatedResult<Service>>
  findById(id: string): Promise<Service | null>
  findByCode(code: string): Promise<Service | null>
  search(query: string): Promise<Service[]>
  create(data: CreateServiceDto): Promise<Service>
  update(id: string, data: UpdateServiceDto): Promise<Service>
  delete(id: string): Promise<void>
  toggleActive(id: string, isActive: boolean): Promise<Service>
}