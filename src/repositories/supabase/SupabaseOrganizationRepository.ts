// src/repositories/supabase/SupabaseOrganizationRepository.ts
// The ONLY place allowed to import the supabase client for organization.
// Covers singleton company_profile, org-unit hierarchy, and positions.

import { supabase } from '@/lib/supabase'
import type { IOrganizationRepository } from '../interfaces/IOrganizationRepository'
import type {
  CompanyProfile,
  UpdateCompanyProfileDto,
  OrganizationUnit,
  CreateOrganizationUnitDto,
  UpdateOrganizationUnitDto,
  OrgTreeNode,
  Position,
  CreatePositionDto,
  UpdatePositionDto,
  OrganizationStats,
} from '@/types/organization.types'
import type { PaginatedResult, PaginationParams } from '@/types/common.types'

export const COMPANY_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

function mapRowToProfile(row: Record<string, unknown>): CompanyProfile {
  return {
    id: row.id as string,
    name: row.name as string,
    legalName: (row.legal_name as string | null) ?? null,
    tagline: (row.tagline as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    address: (row.address as string | null) ?? null,
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
    npwp: (row.npwp as string | null) ?? null,
    nib: (row.nib as string | null) ?? null,
    siup: (row.siup as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapProfileDtoToRow(dto: UpdateCompanyProfileDto): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (dto.name !== undefined) row.name = dto.name
  if (dto.legalName !== undefined) row.legal_name = dto.legalName ?? null
  if (dto.tagline !== undefined) row.tagline = dto.tagline ?? null
  if (dto.logoUrl !== undefined) row.logo_url = dto.logoUrl ?? null
  if (dto.email !== undefined) row.email = dto.email ?? null
  if (dto.phone !== undefined) row.phone = dto.phone ?? null
  if (dto.website !== undefined) row.website = dto.website ?? null
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
  if (dto.npwp !== undefined) row.npwp = dto.npwp ?? null
  if (dto.nib !== undefined) row.nib = dto.nib ?? null
  if (dto.siup !== undefined) row.siup = dto.siup ?? null
  return row
}
function mapRowToUnit(row: Record<string, unknown>): OrganizationUnit {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    type: row.type as OrganizationUnit['type'],
    parentId: (row.parent_id as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapUnitDtoToRow(
  dto: CreateOrganizationUnitDto | UpdateOrganizationUnitDto,
): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (dto.code !== undefined) row.code = dto.code
  if (dto.name !== undefined) row.name = dto.name
  if (dto.type !== undefined) row.type = dto.type
  if (dto.parentId !== undefined) row.parent_id = dto.parentId ?? null
  if (dto.description !== undefined) row.description = dto.description ?? null
  if (dto.sortOrder !== undefined) row.sort_order = dto.sortOrder
  if (dto.isActive !== undefined) row.is_active = dto.isActive
  return row
}

function mapRowToPosition(row: Record<string, unknown>): Position {
  return {
    id: row.id as string,
    code: row.code as string,
    title: row.title as string,
    organizationUnitId: row.organization_unit_id as string,
    level: (row.level as Position['level']) ?? null,
    description: (row.description as string | null) ?? null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function buildTree(units: OrganizationUnit[]): OrgTreeNode[] {
  const byId = new Map<string, OrgTreeNode>()
  for (const u of units) {
    byId.set(u.id, { ...u, level: 0, path: u.name, children: [] })
  }
  const roots: OrgTreeNode[] = []
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const fix = (nodes: OrgTreeNode[], level: number, prefix: string) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    for (const n of nodes) {
      n.level = level
      n.path = prefix ? `${prefix} / ${n.name}` : n.name
      fix(n.children, level + 1, n.path)
    }
  }
  fix(roots, 0, '')
  return roots
}
export class SupabaseOrganizationRepository implements IOrganizationRepository {
  async getCompanyProfile(): Promise<CompanyProfile | null> {
    const { data, error } = await supabase
      .from('company_profile')
      .select('*')
      .eq('id', COMPANY_PROFILE_ID)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRowToProfile(data as Record<string, unknown>) : null
  }

  async updateCompanyProfile(dto: UpdateCompanyProfileDto): Promise<CompanyProfile> {
    const { data, error } = await supabase
      .from('company_profile')
      .update({ ...mapProfileDtoToRow(dto), updated_at: new Date().toISOString() })
      .eq('id', COMPANY_PROFILE_ID)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToProfile(data as Record<string, unknown>)
  }

  async findAllUnits(params: PaginationParams): Promise<PaginatedResult<OrganizationUnit>> {
    const { page, perPage, search, sortBy = 'sort_order', sortDir = 'asc' } = params
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    let query = supabase
      .from('organization_units')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }
    const { data, error, count } = await query
    if (error) throw new Error(error.message)
    const total = count ?? 0
    return {
      data: ((data ?? []) as Record<string, unknown>[]).map(mapRowToUnit),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    }
  }

  async findUnitById(id: string): Promise<OrganizationUnit | null> {
    const { data, error } = await supabase
      .from('organization_units')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRowToUnit(data as Record<string, unknown>) : null
  }

  async findUnitsByParent(parentId: string | null): Promise<OrganizationUnit[]> {
    let query = supabase
      .from('organization_units')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    query = parentId ? query.eq('parent_id', parentId) : query.is('parent_id', null)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToUnit)
  }

  async getUnitTree(): Promise<OrgTreeNode[]> {
    const { data, error } = await supabase
      .from('organization_units')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (error) throw new Error(error.message)
    return buildTree(((data ?? []) as Record<string, unknown>[]).map(mapRowToUnit))
  }

  async createUnit(dto: CreateOrganizationUnitDto): Promise<OrganizationUnit> {
    const { data, error } = await supabase
      .from('organization_units')
      .insert({
        code: dto.code,
        name: dto.name,
        type: dto.type ?? 'department',
        parent_id: dto.parentId ?? null,
        description: dto.description ?? null,
        sort_order: dto.sortOrder ?? 0,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToUnit(data as Record<string, unknown>)
  }

  async updateUnit(id: string, dto: UpdateOrganizationUnitDto): Promise<OrganizationUnit> {
    const { data, error } = await supabase
      .from('organization_units')
      .update({ ...mapUnitDtoToRow(dto), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToUnit(data as Record<string, unknown>)
  }

  async moveUnit(id: string, newParentId: string | null): Promise<OrganizationUnit> {
    return this.updateUnit(id, { parentId: newParentId })
  }

  async deleteUnit(id: string): Promise<void> {
    const { error } = await supabase.from('organization_units').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async toggleUnitActive(id: string, isActive: boolean): Promise<OrganizationUnit> {
    const { data, error } = await supabase
      .from('organization_units')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToUnit(data as Record<string, unknown>)
  }
  async findPositionsByUnit(unitId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('organization_unit_id', unitId)
      .order('title', { ascending: true })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(mapRowToPosition)
  }

  async findPositionById(id: string): Promise<Position | null> {
    const { data, error } = await supabase.from('positions').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRowToPosition(data as Record<string, unknown>) : null
  }

  async createPosition(dto: CreatePositionDto): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .insert({
        code: dto.code,
        title: dto.title,
        organization_unit_id: dto.organizationUnitId,
        level: dto.level ?? null,
        description: dto.description ?? null,
        is_active: dto.isActive ?? true,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToPosition(data as Record<string, unknown>)
  }

  async updatePosition(id: string, dto: UpdatePositionDto): Promise<Position> {
    const row: Record<string, unknown> = {}
    if (dto.code !== undefined) row.code = dto.code
    if (dto.title !== undefined) row.title = dto.title
    if (dto.organizationUnitId !== undefined) row.organization_unit_id = dto.organizationUnitId
    if (dto.level !== undefined) row.level = dto.level ?? null
    if (dto.description !== undefined) row.description = dto.description ?? null
    if (dto.isActive !== undefined) row.is_active = dto.isActive
    const { data, error } = await supabase
      .from('positions')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToPosition(data as Record<string, unknown>)
  }

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase.from('positions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async togglePositionActive(id: string, isActive: boolean): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapRowToPosition(data as Record<string, unknown>)
  }

  async getStats(): Promise<OrganizationStats> {
    const [totalRes, activeRes, posRes, posActiveRes] = await Promise.all([
      supabase.from('organization_units').select('*', { count: 'exact', head: true }),
      supabase.from('organization_units').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('positions').select('*', { count: 'exact', head: true }),
      supabase.from('positions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ])
    const firstError = totalRes.error ?? activeRes.error ?? posRes.error ?? posActiveRes.error
    if (firstError) throw new Error(firstError.message)
    return {
      totalUnits: totalRes.count ?? 0,
      activeUnits: activeRes.count ?? 0,
      totalPositions: posRes.count ?? 0,
      activePositions: posActiveRes.count ?? 0,
    }
  }
}
