// src/types/organization.types.ts
// Company identity (singleton) + flexible org-unit hierarchy + positions.
// Future employees module will FK to OrganizationUnit.id + Position.id.

export type OrganizationUnitType =
  | 'directorate'
  | 'division'
  | 'department'
  | 'section'
  | 'team'
  | 'unit'

export type PositionLevel = 'director' | 'manager' | 'supervisor' | 'staff' | 'intern'

export interface CompanyProfile {
  id: string
  name: string
  legalName: string | null
  tagline: string | null
  logoUrl: string | null
  email: string | null
  phone: string | null
  website: string | null
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
  npwp: string | null
  nib: string | null
  siup: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateCompanyProfileDto {
  name?: string
  legalName?: string | null
  tagline?: string | null
  logoUrl?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  country?: string | null
  province?: string | null
  provinceId?: string | null
  regency?: string | null
  regencyId?: string | null
  district?: string | null
  districtId?: string | null
  village?: string | null
  villageId?: string | null
  postalCode?: string | null
  npwp?: string | null
  nib?: string | null
  siup?: string | null
}

export interface OrganizationUnit {
  id: string
  code: string
  name: string
  type: OrganizationUnitType
  parentId: string | null
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateOrganizationUnitDto {
  code: string
  name: string
  type?: OrganizationUnitType
  parentId?: string | null
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateOrganizationUnitDto = Partial<CreateOrganizationUnitDto>

/** Unit with computed tree metadata (level/path built client-side, never stored). */
export interface OrgTreeNode extends OrganizationUnit {
  level: number
  path: string
  children: OrgTreeNode[]
}

export interface Position {
  id: string
  code: string
  title: string
  organizationUnitId: string
  level: PositionLevel | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePositionDto {
  code: string
  title: string
  organizationUnitId: string
  level?: PositionLevel
  description?: string
  isActive?: boolean
}

export type UpdatePositionDto = Partial<Omit<CreatePositionDto, 'level'>> & {
  level?: PositionLevel | null
}

export interface OrganizationStats {
  totalUnits: number
  activeUnits: number
  totalPositions: number
  activePositions: number
}
