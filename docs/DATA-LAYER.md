> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

# Data Layer — Repository Pattern, Auth, Permissions

## 🔄 Repository Pattern — Complete Guide with Code Examples

### Step 1: Define Types (src/types/customer.types.ts)

```typescript
// src/types/customer.types.ts

export type CustomerType = 'regular' | 'vip' | 'reseller'

export interface Customer {
  id: string
  code: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  type: CustomerType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerDto {
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  type?: CustomerType
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
```

### Step 2: Common Types (src/types/common.types.ts)

```typescript
// src/types/common.types.ts

export interface PaginationParams {
  page: number        // starts at 1
  perPage: number     // default 15
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}
```

### Step 3: Repository Interface (src/repositories/interfaces/ICustomerRepository.ts)

```typescript
// src/repositories/interfaces/ICustomerRepository.ts
// This file is NEVER changed during database migration.
// It is the "contract" — any implementation must match this shape exactly.

import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer.types'
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
}
```

### Step 4: Supabase Implementation (src/repositories/supabase/SupabaseCustomerRepository.ts)

```typescript
// src/repositories/supabase/SupabaseCustomerRepository.ts
// The ONLY file allowed to import the supabase client.
// On migration: create a new file (e.g. RestCustomerRepository.ts), do not delete this one yet.

import { supabase } from '@/lib/supabase'
import type { ICustomerRepository } from '../interfaces/ICustomerRepository'
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer.types'
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
    type: row.type as Customer['type'],
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
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
      data: (data ?? []).map(mapRowToCustomer),
      total: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    }
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return mapRowToCustomer(data)
  }

  async findByCode(code: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('code', code)
      .single()

    if (error) return null
    return mapRowToCustomer(data)
  }

  async search(query: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10)

    if (error) throw new Error(error.message)
    return (data ?? []).map(mapRowToCustomer)
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        code: dto.code,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        type: dto.type ?? 'regular',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToCustomer(data)
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapRowToCustomer(data)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async toggleActive(id: string, isActive: boolean): Promise<Customer> {
    return this.update(id, { isActive } as UpdateCustomerDto)
  }
}
```

### Step 5: Repository Factory — The Migration Point (src/repositories/index.ts)

```typescript
// src/repositories/index.ts
// =====================================================================
// THIS IS THE ONLY FILE THAT CHANGES DURING DATABASE MIGRATION.
// Swap the import source from 'supabase/' to your new provider folder.
// =====================================================================

import { SupabaseCustomerRepository } from './supabase/SupabaseCustomerRepository'
import { SupabaseServiceRepository } from './supabase/SupabaseServiceRepository'
import { SupabaseOrderRepository } from './supabase/SupabaseOrderRepository'
import { SupabaseProjectRepository } from './supabase/SupabaseProjectRepository'
import { SupabaseInvoiceRepository } from './supabase/SupabaseInvoiceRepository'
import { SupabaseFinanceRepository } from './supabase/SupabaseFinanceRepository'

import type { ICustomerRepository } from './interfaces/ICustomerRepository'
import type { IServiceRepository } from './interfaces/IServiceRepository'
import type { IOrderRepository } from './interfaces/IOrderRepository'
import type { IProjectRepository } from './interfaces/IProjectRepository'
import type { IInvoiceRepository } from './interfaces/IInvoiceRepository'
import type { IFinanceRepository } from './interfaces/IFinanceRepository'

// To migrate: replace "new SupabaseXxxRepository()" with "new RestXxxRepository()" etc.
export const customerRepository: ICustomerRepository = new SupabaseCustomerRepository()
export const serviceRepository: IServiceRepository   = new SupabaseServiceRepository()
export const orderRepository: IOrderRepository       = new SupabaseOrderRepository()
export const projectRepository: IProjectRepository   = new SupabaseProjectRepository()
export const invoiceRepository: IInvoiceRepository   = new SupabaseInvoiceRepository()
export const financeRepository: IFinanceRepository   = new SupabaseFinanceRepository()
```

### Step 6: Composable (src/composables/useCustomer.ts)

```typescript
// src/composables/useCustomer.ts
// Views only interact with this composable.
// This composable has NO knowledge of which database is being used.

import { ref, computed } from 'vue'
import { customerRepository } from '@/repositories'
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer.types'
import type { PaginationParams, PaginatedResult } from '@/types/common.types'
import { useToast } from './useToast'

export function useCustomer() {
  const toast = useToast()

  const customers = ref<Customer[]>([])
  const currentCustomer = ref<Customer | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<Omit<PaginatedResult<Customer>, 'data'> | null>(null)

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
      customers.value = customers.value.filter(c => c.id !== id)
      toast.success('Customer deleted successfully')
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
    customers: computed(() => customers.value),
    currentCustomer: computed(() => currentCustomer.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),

    // Actions
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
```

### Step 7: View — How to Use the Composable (src/views/customer/CustomerListView.vue)

```vue
<!-- src/views/customer/CustomerListView.vue -->
<!-- View responsibilities: fetch data via composable, render to template, handle navigation -->
<!-- FORBIDDEN in Views: calling repository directly, importing supabase directly -->

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomer } from '@/composables/useCustomer'
import { usePermission } from '@/composables/usePermission'
import DataTable from '@/components/organisms/DataTable/DataTable.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'

const router = useRouter()
const { customers, loading, pagination, fetchCustomers, deleteCustomer } = useCustomer()
const { can } = usePermission()

const params = ref({ page: 1, perPage: 15, search: '' })

onMounted(() => fetchCustomers(params.value))

function onSearch(query: string) {
  params.value = { ...params.value, search: query, page: 1 }
  fetchCustomers(params.value)
}

function onPageChange(page: number) {
  params.value = { ...params.value, page }
  fetchCustomers(params.value)
}

function goToDetail(id: string) {
  router.push({ name: 'customer-detail', params: { id } })
}

async function handleDelete(id: string) {
  if (!can('delete', 'customers')) return
  await deleteCustomer(id)
}
</script>

<template>
  <DashboardLayout>
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-800">Customers</h1>
        <router-link
          v-if="can('create', 'customers')"
          :to="{ name: 'customer-create' }"
          class="btn-primary"
        >
          + Add Customer
        </router-link>
      </div>

      <DataTable
        :data="customers"
        :loading="loading"
        :pagination="pagination"
        @search="onSearch"
        @page-change="onPageChange"
        @row-click="(row) => goToDetail(row.id)"
      >
        <template #column-type="{ value }">
          <AppBadge :variant="value === 'vip' ? 'warning' : 'default'">{{ value }}</AppBadge>
        </template>
        <template #column-isActive="{ value }">
          <AppBadge :variant="value ? 'success' : 'danger'">
            {{ value ? 'Active' : 'Inactive' }}
          </AppBadge>
        </template>
      </DataTable>
    </div>
  </DashboardLayout>
</template>
```

---

## 🔐 Auth Abstraction (src/composables/useAuth.ts)

```typescript
// src/composables/useAuth.ts
// Vue NEVER knows that auth uses Supabase.
// On auth migration: change ONLY this file and lib/supabase.ts.

import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
  const authStore = useAuthStore()
  const loading = ref(false)

  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      authStore.setUser(data.user)
      return true
    } catch {
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    authStore.clearUser()
  }

  async function forgotPassword(email: string): Promise<boolean> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return !error
  }

  // On migration: replace the above functions with REST calls to the new auth provider.
  // All callers (LoginView, etc.) require zero changes.

  return {
    login,
    logout,
    forgotPassword,
    loading: computed(() => loading.value),
    currentUser: computed(() => authStore.user),
    isAuthenticated: computed(() => !!authStore.user),
    hasRole: (role: string) => authStore.roles.includes(role),
  }
}
```

---

## 🛡️ Permission System (src/composables/usePermission.ts)

```typescript
// src/composables/usePermission.ts
// Controls what each role can see and do in the UI.
// IMPORTANT: This is UI-only protection. Real security is enforced by database RLS.
// Never skip RLS just because this composable blocks the UI action.

import { useAuthStore } from '@/stores/auth.store'

type Action = 'create' | 'read' | 'update' | 'delete'
type Resource = 'customers' | 'services' | 'orders' | 'projects' | 'invoices' | 'transactions'

// Define what each role can do
const PERMISSIONS: Record<string, Record<Resource, Action[]>> = {
  admin: {
    customers:    ['create', 'read', 'update', 'delete'],
    services:     ['create', 'read', 'update', 'delete'],
    orders:       ['create', 'read', 'update', 'delete'],
    projects:     ['create', 'read', 'update', 'delete'],
    invoices:     ['create', 'read', 'update', 'delete'],
    transactions: ['create', 'read', 'update', 'delete'],
  },
  staff: {
    customers:    ['create', 'read', 'update'],
    services:     ['read'],
    orders:       ['create', 'read', 'update'],
    projects:     ['create', 'read', 'update'],
    invoices:     ['create', 'read', 'update'],
    transactions: ['read'],
  },
  viewer: {
    customers:    ['read'],
    services:     ['read'],
    orders:       ['read'],
    projects:     ['read'],
    invoices:     ['read'],
    transactions: [],
  },
}

export function usePermission() {
  const authStore = useAuthStore()

  function can(action: Action, resource: Resource): boolean {
    const role = authStore.role ?? 'viewer'
    return PERMISSIONS[role]?.[resource]?.includes(action) ?? false
  }

  function canAny(actions: Action[], resource: Resource): boolean {
    return actions.some(action => can(action, resource))
  }

  return { can, canAny }
}
```

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
