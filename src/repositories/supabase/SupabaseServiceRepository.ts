// src/repositories/supabase/SupabaseServiceRepository.ts
// The ONLY place allowed to import the supabase client for services.
// On migration: create a new file (e.g. RestServiceRepository.ts), do not delete this one yet.

import { supabase } from '@/lib/supabase'
import type { IServiceRepository } from '../interfaces/IServiceRepository'
import type { Service, CreateServiceDto, UpdateServiceDto } from '@/types/service.types'
import type { PaginatedResult, PaginationParams } from '@/types/common.types'

// Maps snake_case DB columns to camelCase TypeScript properties.
// base_price is NUMERIC(15,2) — PostgREST may return it as string, so coerce with Number().
function mapRowToService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string | null,
    unit: row.unit as string | null,
    basePrice: Number(row.base_price),
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export class SupabaseServiceRepository implements IServiceRepository {
  async findAll(params: PaginationParams): Promise<PaginatedResult<Service>> {
    const { page, perPage, search, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,category.ilike.%${search}%`)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      data: (data ?? []).map((row) => mapRowToService(row as Record<string, unknown>)),
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    }
  }

  async findById(id: string): Promise<Service | null> {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single()

    if (error) return null
    return mapRowToService(data as Record<string, unknown>)
  }

  async findByCode(code: string): Promise<Service | null> {
    const { data, error } = await supabase.from('services').select('*').eq('code', code).single()

    if (error) return null
    return mapRowToService(data as Record<string, unknown>)
  }

  async search(query: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10)

    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => mapRowToService(row as Record<string, unknown>))
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        code: dto.code,
        name: dto.name,
        description: dto.description ?? null,
        category: dto.category ?? null,
        unit: dto.unit ?? null,
        base_price: dto.basePrice,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToService(data as Record<string, unknown>)
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const { isActive, basePrice, ...rest } = dto
    const { data, error } = await supabase
      .from('services')
      .update({
        ...rest,
        ...(isActive !== undefined ? { is_active: isActive } : {}),
        ...(basePrice !== undefined ? { base_price: basePrice } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToService(data as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async toggleActive(id: string, isActive: boolean): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToService(data as Record<string, unknown>)
  }
}