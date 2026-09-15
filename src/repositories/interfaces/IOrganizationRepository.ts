// src/repositories/interfaces/IOrganizationRepository.ts
// This file is NEVER changed during database migration.
// It is the "contract" — any implementation must match this shape exactly.
// Covers the singleton company profile, the org-unit hierarchy, and positions.

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

export interface IOrganizationRepository {
  // Singleton company profile (id is fixed server-side)
  getCompanyProfile(): Promise<CompanyProfile | null>
  updateCompanyProfile(data: UpdateCompanyProfileDto): Promise<CompanyProfile>

  // Organization units — flat (for tables/dropdowns) + tree (for hierarchy view)
  findAllUnits(params: PaginationParams): Promise<PaginatedResult<OrganizationUnit>>
  findUnitById(id: string): Promise<OrganizationUnit | null>
  findUnitsByParent(parentId: string | null): Promise<OrganizationUnit[]>
  getUnitTree(): Promise<OrgTreeNode[]>
  createUnit(data: CreateOrganizationUnitDto): Promise<OrganizationUnit>
  updateUnit(id: string, data: UpdateOrganizationUnitDto): Promise<OrganizationUnit>
  moveUnit(id: string, newParentId: string | null): Promise<OrganizationUnit>
  deleteUnit(id: string): Promise<void>
  toggleUnitActive(id: string, isActive: boolean): Promise<OrganizationUnit>

  // Positions (managed inside the owning unit's detail view)
  findPositionsByUnit(unitId: string): Promise<Position[]>
  findPositionById(id: string): Promise<Position | null>
  createPosition(data: CreatePositionDto): Promise<Position>
  updatePosition(id: string, data: UpdatePositionDto): Promise<Position>
  deletePosition(id: string): Promise<void>
  togglePositionActive(id: string, isActive: boolean): Promise<Position>

  getStats(): Promise<OrganizationStats>
}
