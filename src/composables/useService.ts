// src/composables/useService.ts
// Views only interact with this composable.
// This composable has NO knowledge of which database is being used.

import { ref, computed } from 'vue'
import { serviceRepository } from '@/repositories'
import type { Service, CreateServiceDto, UpdateServiceDto } from '@/types/service.types'
import type { PaginationParams, PaginatedResult } from '@/types/common.types'
import { useToast } from './useToast'

export function useService() {
  const toast = useToast()

  const services = ref<Service[]>([])
  const currentService = ref<Service | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Omit<PaginatedResult<Service>, 'data'> | null>(null)

  async function fetchServices(params: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      const result = await serviceRepository.findAll(params)
      services.value = result.data
      pagination.value = {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      }
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load services')
    } finally {
      loading.value = false
    }
  }

  async function fetchServiceById(id: string) {
    loading.value = true
    try {
      currentService.value = await serviceRepository.findById(id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createService(dto: CreateServiceDto): Promise<Service | null> {
    loading.value = true
    try {
      const created = await serviceRepository.create(dto)
      toast.success('Service created successfully')
      return created
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateService(id: string, dto: UpdateServiceDto): Promise<Service | null> {
    loading.value = true
    try {
      const updated = await serviceRepository.update(id, dto)
      toast.success('Service updated successfully')
      return updated
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteService(id: string): Promise<boolean> {
    loading.value = true
    try {
      await serviceRepository.delete(id)
      services.value = services.value.filter((s) => s.id !== id)
      toast.success('Service deleted successfully')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State (read-only via computed)
    services: computed(() => services.value),
    currentService: computed(() => currentService.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),

    // Actions
    fetchServices,
    fetchServiceById,
    createService,
    updateService,
    deleteService,
  }
}