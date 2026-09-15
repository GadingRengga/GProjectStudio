// src/composables/useCustomer.ts
// Views only interact with this composable.
// This composable has NO knowledge of which database is being used.

import { ref, computed } from 'vue'
import { customerRepository } from '@/repositories'
import type { Customer, CreateCustomerDto, UpdateCustomerDto, CustomerStats, MonthlyTrendPoint } from '@/types/customer.types'
import type { PaginationParams, PaginatedResult } from '@/types/common.types'
import { useToast } from './useToast'

export function useCustomer() {
  const toast = useToast()

  const customers = ref<Customer[]>([])
  const currentCustomer = ref<Customer | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Omit<PaginatedResult<Customer>, 'data'> | null>(null)
  const stats = ref<CustomerStats | null>(null)
  const trend = ref<MonthlyTrendPoint[]>([])
  const statsLoading = ref(false)

  async function fetchCustomers(params: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      const result = await customerRepository.findAll(params)
      customers.value = result.data
      pagination.value = {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      }
    } catch (e) {
      error.value = (e as Error).message
      toast.error('Failed to load customers')
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerById(id: string) {
    loading.value = true
    try {
      currentCustomer.value = await customerRepository.findById(id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(dto: CreateCustomerDto): Promise<Customer | null> {
    loading.value = true
    try {
      const created = await customerRepository.create(dto)
      toast.success('Customer created successfully')
      return created
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer | null> {
    loading.value = true
    try {
      const updated = await customerRepository.update(id, dto)
      toast.success('Customer updated successfully')
      return updated
    } catch (e) {
      toast.error((e as Error).message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id: string): Promise<boolean> {
    loading.value = true
    try {
      await customerRepository.delete(id)
      customers.value = customers.value.filter((c) => c.id !== id)
      toast.success('Customer deleted successfully')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerStats(months = 12): Promise<void> {
    statsLoading.value = true
    try {
      const [fetchedStats, fetchedTrend] = await Promise.all([
        customerRepository.getStats(),
        customerRepository.getMonthlyTrend(months),
      ])
      stats.value = fetchedStats
      trend.value = fetchedTrend
    } catch {
      toast.error('Failed to load customer statistics')
    } finally {
      statsLoading.value = false
    }
  }

  return {
    // State (read-only via computed)
    customers: computed(() => customers.value),
    currentCustomer: computed(() => currentCustomer.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),
    stats: computed(() => stats.value),
    trend: computed(() => trend.value),
    statsLoading: computed(() => statsLoading.value),

    // Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomerStats,
  }
}
