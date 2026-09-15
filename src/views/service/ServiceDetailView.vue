<!-- src/views/service/ServiceDetailView.vue -->
<!-- PAGE: fetches one service via composable, delegates rendering to atoms/molecules. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useService } from '@/composables/useService'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import Button from '@/components/ui/Button.vue'
import { formatDatetime } from '@/utils/date'
import { formatRupiah } from '@/utils/currency'

const route = useRoute()
const router = useRouter()
const { currentService, loading, fetchServiceById } = useService()
const { can } = usePermission()

const serviceId = computed(() => route.params.id as string)
const canUpdate = computed(() => can('update', 'services'))

onMounted(() => {
  void fetchServiceById(serviceId.value)
})

function goToEdit() {
  router.push({ name: 'service-edit', params: { id: serviceId.value } })
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Service Detail'" />

    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="Service Detail">
        <div v-if="loading" class="flex justify-center py-16">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="!currentService" class="py-10 text-center">
          <p class="font-medium text-gray-700 text-theme-sm dark:text-white/90">Service not found</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">It may have been deleted or you lack access.</p>
        </div>

        <div v-else>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium tracking-wide text-gray-400 uppercase">
                {{ currentService.code }}
              </p>
              <h3 class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                {{ currentService.name }}
              </h3>
              <div class="mt-3 flex items-center gap-2">
                <AppBadge v-if="currentService.category" variant="info">
                  {{ currentService.category }}
                </AppBadge>
                <AppBadge :variant="currentService.isActive ? 'success' : 'danger'">
                  {{ currentService.isActive ? 'Active' : 'Inactive' }}
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
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Base Price</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ formatRupiah(currentService.basePrice) }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Unit</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentService.unit ?? '-' }}
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Description</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ currentService.description ?? '-' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Created</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ formatDatetime(currentService.createdAt) }}
                </dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Updated</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">
                  {{ formatDatetime(currentService.updatedAt) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>