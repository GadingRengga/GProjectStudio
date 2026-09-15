<!-- src/views/customer/CustomerDetailView.vue -->
<!-- PAGE: fetches one customer via composable, delegates rendering to atoms/molecules. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomer } from '@/composables/useCustomer'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import Button from '@/components/ui/Button.vue'
import { formatDatetime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const { currentCustomer, loading, fetchCustomerById } = useCustomer()
const { can } = usePermission()

const customerId = computed(() => route.params.id as string)
const canUpdate = computed(() => can('update', 'customers'))

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  company: 'Company',
  personal: 'Personal',
  institute: 'Institute',
  university: 'University',
  bumn: 'BUMN',
}

const typeLabel = computed(
  () => CUSTOMER_TYPE_LABELS[currentCustomer.value?.type ?? ''] ?? currentCustomer.value?.type ?? '-',
)

const typeBadgeVariant = computed(() => {
  switch (currentCustomer.value?.type) {
    case 'bumn':
      return 'warning' as const
    case 'company':
      return 'info' as const
    case 'university':
      return 'success' as const
    default:
      return 'default' as const
  }
})

onMounted(() => {
  void fetchCustomerById(customerId.value)
})

function goToEdit() {
  router.push({ name: 'customer-edit', params: { id: customerId.value } })
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Customer Detail'" />

    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Customer Detail">
        <div v-if="loading" class="flex justify-center py-16">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="!currentCustomer" class="py-10 text-center">
          <p class="font-medium text-gray-700 text-theme-sm dark:text-white/90">Customer not found</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">It may have been deleted or you lack access.</p>
        </div>

        <div v-else>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium tracking-wide text-gray-400 uppercase">
                {{ currentCustomer.code }}
              </p>
              <h3 class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                {{ currentCustomer.name }}
              </h3>
              <div class="mt-3 flex items-center gap-2">
                <AppBadge :variant="typeBadgeVariant">
                  {{ typeLabel }}
                </AppBadge>
                <AppBadge :variant="currentCustomer.isActive ? 'success' : 'danger'">
                  {{ currentCustomer.isActive ? 'Active' : 'Inactive' }}
                </AppBadge>
              </div>
            </div>
            <Button
              v-if="canUpdate"
              variant="outline"
              size="sm"
              @click="goToEdit"
            >
              Edit
            </Button>
          </div>

          <div class="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Email</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.email ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Phone</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.phone ?? '-' }}
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Street</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.address ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Village</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.village ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">District</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.district ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Regency / City</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.regency ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Province</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.province ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Postal Code</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.postalCode ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Country</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentCustomer.country ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Created</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ formatDatetime(currentCustomer.createdAt) }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Updated</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ formatDatetime(currentCustomer.updatedAt) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
