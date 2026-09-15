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
import IconButton from '@/components/atoms/IconButton.vue'
import Alert from '@/components/ui/Alert.vue'
import DetailField from '@/components/molecules/DetailField.vue'
import { Pencil, Wrench } from 'lucide-vue-next'
import { formatDatetime } from '@/utils/date'
import { formatRupiah } from '@/utils/currency'

const route = useRoute()
const router = useRouter()
const { currentService, loading, error, fetchServiceById } = useService()
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
      <Alert
        v-if="error && !loading"
        variant="error"
        title="Failed to load service"
        :message="error"
      />

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
            <div class="flex items-start gap-4">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"
              >
                <Wrench class="h-7 w-7" />
              </div>
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
            </div>
            <IconButton
              v-if="canUpdate"
              :icon="Pencil"
              tooltip="Edit Service"
              tone="brand"
              size="md"
              @click="goToEdit"
            />
          </div>

          <div class="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            <section
              class="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5"
            >
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Pricing & Availability</h4>
              <dl class="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <DetailField label="Base Price">{{ formatRupiah(currentService.basePrice) }}</DetailField>
                <DetailField label="Unit">{{ currentService.unit ?? '-' }}</DetailField>
              </dl>
            </section>

            <section
              class="mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5"
            >
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Description</h4>
              <p class="mt-2 whitespace-pre-line text-theme-sm text-gray-800 dark:text-white/90">
                {{ currentService.description ?? '-' }}
              </p>
            </section>

            <dl class="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <DetailField label="Created">{{ formatDatetime(currentService.createdAt) }}</DetailField>
              <DetailField label="Updated">{{ formatDatetime(currentService.updatedAt) }}</DetailField>
            </dl>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>