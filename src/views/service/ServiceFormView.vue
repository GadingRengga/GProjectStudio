<!-- src/views/service/ServiceFormView.vue -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useService } from '@/composables/useService'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import FormField from '@/components/molecules/FormField.vue'
import Button from '@/components/ui/Button.vue'
import { isRequired, isNonNegativeNumber } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const { currentService, loading, fetchServiceById, createService, updateService } = useService()
const { can } = usePermission()

const serviceId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(serviceId.value))

const form = reactive({
  code: '',
  name: '',
  category: '',
  unit: '',
  basePrice: 0,
  description: '',
  isActive: true,
})
const errors = reactive<Record<string, string>>({})
const saving = ref(false)

const canWrite = computed(() =>
  isEdit.value ? can('update', 'services') : can('create', 'services'),
)

onMounted(async () => {
  if (serviceId.value) {
    await fetchServiceById(serviceId.value)
    const s = currentService.value
    if (s) {
      form.code = s.code
      form.name = s.name
      form.category = s.category ?? ''
      form.unit = s.unit ?? ''
      form.basePrice = s.basePrice
      form.description = s.description ?? ''
      form.isActive = s.isActive
    }
  }
})

function validate(): boolean {
  errors.code = !isRequired(form.code) ? 'Code is required.' : ''
  errors.name = !isRequired(form.name) ? 'Name is required.' : ''
  errors.basePrice = !isNonNegativeNumber(form.basePrice) ? 'Base price must be 0 or more.' : ''
  return !errors.code && !errors.name && !errors.basePrice
}

async function handleSubmit() {
  if (!canWrite.value || saving.value) return
  if (!validate()) return
  saving.value = true
  try {
    const dto = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      unit: form.unit.trim() || undefined,
      basePrice: form.basePrice,
      description: form.description.trim() || undefined,
    }
    if (isEdit.value && serviceId.value) {
      const updated = await updateService(serviceId.value, dto)
      if (updated) router.push({ name: 'service-detail', params: { id: updated.id } })
    } else {
      const created = await createService(dto)
      if (created) router.push({ name: 'service-detail', params: { id: created.id } })
    }
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (isEdit.value && serviceId.value) {
    router.push({ name: 'service-detail', params: { id: serviceId.value } })
  } else {
    router.push({ name: 'service-list' })
  }
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="isEdit ? 'Edit Service' : 'New Service'" />

    <div class="space-y-5 sm:space-y-6">
      <ComponentCard :title="isEdit ? 'Edit Service' : 'New Service'">
        <p v-if="!canWrite" class="mb-5 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700" role="alert">
          You do not have permission to {{ isEdit ? 'update' : 'create' }} services.
        </p>

        <form class="space-y-6" novalidate @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField label="Code" required :error="errors.code">
              <input
                v-model="form.code"
                type="text"
                :disabled="isEdit"
                placeholder="SRV-001"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:bg-gray-100 dark:disabled:bg-gray-800"
              />
            </FormField>
            <FormField label="Category">
              <input
                v-model="form.category"
                type="text"
                placeholder="Design / Video / Print"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </FormField>
          </div>

          <FormField label="Name" required :error="errors.name">
            <input
              v-model="form.name"
              type="text"
              placeholder="Logo redesign package"
              class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </FormField>

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField label="Base Price (IDR)" required :error="errors.basePrice">
              <input
                v-model.number="form.basePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </FormField>
            <FormField label="Unit">
              <input
                v-model="form.unit"
                type="text"
                placeholder="hour / package / item / day"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="What is included in this service?"
              class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </FormField>

          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-400">
            <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded border-gray-300" />
            Active service
          </label>

          <div class="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" @click="goBack">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" :disabled="saving || loading || !canWrite">
              {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create service' }}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
