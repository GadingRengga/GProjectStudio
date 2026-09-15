// src/repositories/supabase/SupabaseCustomerRepository.ts
// The ONLY place allowed to import the supabase client for customers.
// On migration: create a new file (e.g. RestCustomerRepository.ts), do not delete this one yet.

import { supabase } from '@/lib/supabase'
import type { ICustomerRepository } from '../interfaces/ICustomerRepository'
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerStats, MonthlyTrendPoint } from '@/types/customer.types'
import type { PaginatedResult, PaginationParams } from '@/types/common.types'

// Maps snake_case DB columns to camelCase TypeScript properties
function mapRowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    address: row.address as string | null,
    country: (row.country as string | null) ?? null,
    province: (row.province as string | null) ?? null,
    provinceId: (row.province_id as string | null) ?? null,
    regency: (row.regency as string | null) ?? null,
    regencyId: (row.regency_id as string | null) ?? null,
    district: (row.district as string | null) ?? null,
    districtId: (row.district_id as string | null) ?? null,
    village: (row.village as string | null) ?? null,
    villageId: (row.village_id as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    type: row.type as Customer['type'],
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

// Maps camelCase DTO to snake_case DB payload (undefined keys are skipped)
function mapDtoToRow(dto: CreateCustomerDto | UpdateCustomerDto): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (dto.code !== undefined) row.code = dto.code
  if (dto.name !== undefined) row.name = dto.name
  if (dto.email !== undefined) row.email = dto.email ?? null
  if (dto.phone !== undefined) row.phone = dto.phone ?? null
  if (dto.address !== undefined) row.address = dto.address ?? null
  if (dto.country !== undefined) row.country = dto.country ?? null
  if (dto.province !== undefined) row.province = dto.province ?? null
  if (dto.provinceId !== undefined) row.province_id = dto.provinceId ?? null
  if (dto.regency !== undefined) row.regency = dto.regency ?? null
  if (dto.regencyId !== undefined) row.regency_id = dto.regencyId ?? null
  if (dto.district !== undefined) row.district = dto.district ?? null
  if (dto.districtId !== undefined) row.district_id = dto.districtId ?? null
  if (dto.village !== undefined) row.village = dto.village ?? null
  if (dto.villageId !== undefined) row.village_id = dto.villageId ?? null
  if (dto.postalCode !== undefined) row.postal_code = dto.postalCode ?? null
  if (dto.type !== undefined) row.type = dto.type
  if (dto.isActive !== undefined) row.is_active = dto.isActive
  return row
}

export class SupabaseCustomerRepository implements ICustomerRepository {
  async findAll(params: PaginationParams): Promise<PaginatedResult<Customer>> {
    const { page, perPage, search, sortBy = 'created_at', sortDir = 'desc' } = params
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return {
      data: (data ?? []).map((row) => mapRowToCustomer(row as Record<string, unknown>)),
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    }
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()

    if (error) return null
    return mapRowToCustomer(data as Record<string, unknown>)
  }

  async findByCode(code: string): Promise<Customer | null> {
    const { data, error } = await supabase.from('customers').select('*').eq('code', code).single()

    if (error) return null
    return mapRowToCustomer(data as Record<string, unknown>)
  }

  async search(query: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10)

    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => mapRowToCustomer(row as Record<string, unknown>))
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const payload = {
      ...mapDtoToRow({ ...dto, type: dto.type ?? 'company', isActive: dto.isActive ?? true }),
    }
    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToCustomer(data as Record<string, unknown>)
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...mapDtoToRow(dto),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToCustomer(data as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async toggleActive(id: string, isActive: boolean): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers').update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToCustomer(data as Record<string, unknown>)
  }

  async getStats(): Promise<CustomerStats> {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [totalRes, activeRes, newRes, companyRes] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('customers').select('*', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('type', 'company'),
    ])

    const firstError = totalRes.error ?? activeRes.error ?? newRes.error ?? companyRes.error
    if (firstError) throw new Error(firstError.message)

    const total = totalRes.count ?? 0
    const active = activeRes.count ?? 0
    return {
      total,
      active,
      inactive: total - active,
      newThisMonth: newRes.count ?? 0,
      companies: companyRes.count ?? 0,
    }
  }

  async getMonthlyTrend(months = 12): Promise<MonthlyTrendPoint[]> {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

    const { data, error } = await supabase
      .from('customers')
      .select('created_at')
      .gte('created_at', start.toISOString())

    if (error) throw new Error(error.message)

    const buckets = new Map<string, number>()
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      buckets.set(key, 0)
    }

    for (const row of (data ?? []) as { created_at: string }[]) {
      const d = new Date(row.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return [...buckets.entries()].map(([key, value]) => {
      const [, m] = key.split('-').map(Number)
      return { label: monthNames[m as number], value }
    })
  }
}
