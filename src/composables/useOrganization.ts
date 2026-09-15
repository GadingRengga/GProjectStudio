// src/composables/useOrganization.ts
// Views only interact with this composable.
// This composable has NO knowledge of which database is being used.

import { ref, computed } from 'vue'
import { organizationRepository } from '@/repositories'
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
import type { PaginationParams, PaginatedResult } from '@/types/common.types'
import { useToast } from './useToast'

export function useOrganization() {
  const toast = useToast()

  const profile = ref<CompanyProfile | null>(null)
  const units = ref<OrganizationUnit[]>([])
  const tree = ref<OrgTreeNode[]>([])
  const currentUnit = ref<OrganizationUnit | null>(null)
  const childUnits = ref<OrganizationUnit[]>([])
  const positions = ref<Position[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Omit<PaginatedResult<OrganizationUnit>, 'data'> | null>(null)
  const stats = ref<OrganizationStats | null>(null)
  async function fetchProfile() {
    loading.value = true
    try {
      profile.value = await organizationRepository.getCompanyProfile()
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load company profile')
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(dto: UpdateCompanyProfileDto): Promise<CompanyProfile | null> {
    loading.value = true
    try {
      profile.value = await organizationRepository.updateCompanyProfile(dto)
      toast.success('Company profile updated successfully')
      return profile.value
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchUnits(params: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      const result = await organizationRepository.findAllUnits(params)
      units.value = result.data
      pagination.value = {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      }
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load organization units')
    } finally {
      loading.value = false
    }
  }

  async function fetchTree() {
    loading.value = true
    error.value = null
    try {
      tree.value = await organizationRepository.getUnitTree()
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load organization tree')
    } finally {
      loading.value = false
    }
  }

  async function fetchUnitById(id: string) {
    loading.value = true
    // Clear stale data so navigating between units never flashes the previous
    // unit's positions/children.
    positions.value = []
    childUnits.value = []
    try {
      currentUnit.value = await organizationRepository.findUnitById(id)
      if (currentUnit.value) {
        positions.value = await organizationRepository.findPositionsByUnit(id)
      }
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load organization unit')
    } finally {
      loading.value = false
    }
  }

  async function fetchChildUnits(parentId: string) {
    try {
      childUnits.value = await organizationRepository.findUnitsByParent(parentId)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function createUnit(dto: CreateOrganizationUnitDto): Promise<OrganizationUnit | null> {
    loading.value = true
    try {
      const created = await organizationRepository.createUnit(dto)
      toast.success('Organization unit created successfully')
      return created
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateUnit(id: string, dto: UpdateOrganizationUnitDto): Promise<OrganizationUnit | null> {
    loading.value = true
    try {
      const updated = await organizationRepository.updateUnit(id, dto)
      toast.success('Organization unit updated successfully')
      return updated
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteUnit(id: string): Promise<boolean> {
    loading.value = true
    try {
      await organizationRepository.deleteUnit(id)
      units.value = units.value.filter((u) => u.id !== id)
      toast.success('Organization unit deleted successfully')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchPositions(unitId: string) {
    loading.value = true
    try {
      positions.value = await organizationRepository.findPositionsByUnit(unitId)
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load positions')
    } finally {
      loading.value = false
    }
  }

  async function createPosition(dto: CreatePositionDto): Promise<Position | null> {
    try {
      const created = await organizationRepository.createPosition(dto)
      positions.value = [...positions.value, created]
      toast.success('Position created successfully')
      return created
    } catch (e) {
      toast.error((e as Error).message)
      return null
    }
  }

  async function updatePosition(id: string, dto: UpdatePositionDto): Promise<Position | null> {
    try {
      const updated = await organizationRepository.updatePosition(id, dto)
      positions.value = positions.value.map((p) => (p.id === id ? updated : p))
      toast.success('Position updated successfully')
      return updated
    } catch (e) {
      toast.error((e as Error).message)
      return null
    }
  }

  async function deletePosition(id: string): Promise<boolean> {
    try {
      await organizationRepository.deletePosition(id)
      positions.value = positions.value.filter((p) => p.id !== id)
      toast.success('Position deleted successfully')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  async function moveUnit(id: string, newParentId: string | null): Promise<OrganizationUnit | null> {
    loading.value = true
    try {
      const moved = await organizationRepository.moveUnit(id, newParentId)
      toast.success('Unit moved successfully')
      return moved
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function toggleUnitActive(id: string, isActive: boolean): Promise<OrganizationUnit | null> {
    loading.value = true
    try {
      const updated = await organizationRepository.toggleUnitActive(id, isActive)
      units.value = units.value.map((u) => (u.id === id ? updated : u))
      if (currentUnit.value?.id === id) currentUnit.value = updated
      toast.success(isActive ? 'Unit activated' : 'Unit deactivated')
      return updated
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function togglePositionActive(id: string, isActive: boolean): Promise<Position | null> {
    try {
      const updated = await organizationRepository.togglePositionActive(id, isActive)
      positions.value = positions.value.map((p) => (p.id === id ? updated : p))
      toast.success(isActive ? 'Position activated' : 'Position deactivated')
      return updated
    } catch (e) {
      toast.error((e as Error).message)
      return null
    }
  }

  async function fetchStats(): Promise<void> {
    try {
      stats.value = await organizationRepository.getStats()
    } catch {
      toast.error('Failed to load organization statistics')
    }
  }

  return {
    profile: computed(() => profile.value),
    units: computed(() => units.value),
    tree: computed(() => tree.value),
    currentUnit: computed(() => currentUnit.value),
    childUnits: computed(() => childUnits.value),
    positions: computed(() => positions.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),
    stats: computed(() => stats.value),
    fetchProfile,
    saveProfile,
    fetchUnits,
    fetchTree,
    fetchUnitById,
    fetchChildUnits,
    createUnit,
    updateUnit,
    moveUnit,
    toggleUnitActive,
    deleteUnit,
    fetchPositions,
    createPosition,
    updatePosition,
    togglePositionActive,
    deletePosition,
    fetchStats,
  }
}
