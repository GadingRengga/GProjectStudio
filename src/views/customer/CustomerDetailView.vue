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
import IconButton from '@/components/atoms/IconButton.vue'
import Alert from '@/components/ui/Alert.vue'
import DetailField from '@/components/molecules/DetailField.vue'
import { Building2, Pencil } from 'lucide-vue-next'
import { formatDatetime } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const { currentCustomer, loading, error, fetchCustomerById } = useCustomer()
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
      <Alert
        v-if="error && !loading"
        variant="error"
        title="Failed to load customer"
        :message="error"
      />

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
            <div class="flex items-start gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"
              >
                <Building2 class="h-7 w-7" />
              </div>
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
            </div>
            <IconButton
              v-if="canUpdate"
              :icon="Pencil"
              tooltip="Edit Customer"
              tone="brand"
              size="md"
              @click="goToEdit"
            />
          </div>

          <div class="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section
                class="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5"
              >
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Contact Information</h4>
                <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm">
                  <DetailField label="Email">{{ currentCustomer.email ?? '-' }}</DetailField>
                  <DetailField label="Phone">{{ currentCustomer.phone ?? '-' }}</DetailField>
                  <DetailField label="Country">{{ currentCustomer.country ?? '-' }}</DetailField>
                  <DetailField label="Postal Code">{{ currentCustomer.postalCode ?? '-' }}</DetailField>
                </dl>
              </section>

              <section
                class="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5"
              >
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Address</h4>
                <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm">
                  <DetailField label="Street" wide>{{ currentCustomer.address ?? '-' }}</DetailField>
                  <DetailField label="Village">{{ currentCustomer.village ?? '-' }}</DetailField>
                  <DetailField label="District">{{ currentCustomer.district ?? '-' }}</DetailField>
                  <DetailField label="Regency / City">{{ currentCustomer.regency ?? '-' }}</DetailField>
                  <DetailField label="Province">{{ currentCustomer.province ?? '-' }}</DetailField>
                </dl>
              </section>
            </div>

            <dl class="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <DetailField label="Created">{{ formatDatetime(currentCustomer.createdAt) }}</DetailField>
              <DetailField label="Updated">{{ formatDatetime(currentCustomer.updatedAt) }}</DetailField>
            </dl>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
