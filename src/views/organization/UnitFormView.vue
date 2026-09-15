<!-- src/views/organization/UnitFormView.vue -->
<!-- PAGE: create/edit one organization unit. -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganization } from '@/composables/useOrganization'
import { usePermission } from '@/composables/usePermission'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import FormField from '@/components/molecules/FormField.vue'
import Button from '@/components/ui/Button.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import type { OrganizationUnitType } from '@/types/organization.types'
import { isRequired } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const { currentUnit, units, loading, fetchUnitById, fetchUnits, createUnit, updateUnit } =
  useOrganization()
const { can } = usePermission()

const unitId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(unitId.value))

const UNIT_TYPES: { value: OrganizationUnitType; label: string }[] = [
  { value: 'directorate', label: 'Directorate' },
  { value: 'division', label: 'Division' },
  { value: 'department', label: 'Department' },
  { value: 'section', label: 'Section' },
  { value: 'team', label: 'Team' },
  { value: 'unit', label: 'Unit' },
]

const INPUT_CLASS =
  'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

const SELECT_CLASS =
  'dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

const form = reactive({
  code: '',
  name: '',
  type: 'department' as OrganizationUnitType,
  parentId: '',
  description: '',
  sortOrder: 0,
  isActive: true,
})
const errors = reactive<Record<string, string>>({})
const saving = ref(false)

const canWrite = computed(() =>
  isEdit.value ? can('update', 'organization') : can('create', 'organization'),
)

// A unit cannot be its own parent. Deeper cycles (unit → child → unit) are
// rejected by the database trigger fn_prevent_org_cycle().
const parentOptions = computed(() => units.value.filter((u) => u.id !== unitId.value))
const selectedParentName = computed(
  () => parentOptions.value.find((u) => u.id === form.parentId)?.name ?? '',
)

onMounted(async () => {
  void fetchUnits({ page: 1, perPage: 500, sortBy: 'name', sortDir: 'asc' })
  if (unitId.value) {
    await fetchUnitById(unitId.value)
    const unit = currentUnit.value
    if (unit) {
      form.code = unit.code
      form.name = unit.name
      form.type = unit.type
      form.parentId = unit.parentId ?? ''
      form.description = unit.description ?? ''
      form.sortOrder = unit.sortOrder
      form.isActive = unit.isActive
    }
  } else {
    form.parentId = (route.query.parentId as string) ?? ''
  }
})

function validate(): boolean {
  errors.code = isRequired(form.code) ? '' : 'Code is required'
  errors.name = isRequired(form.name) ? '' : 'Name is required'
  return !errors.code && !errors.name
}

async function handleSave() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    const dto = {
      code: form.code,
      name: form.name,
      type: form.type,
      parentId: form.parentId || null,
      description: form.description,
      // v-model.number keeps '' when the input is cleared — coerce to 0.
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    }
    const saved = isEdit.value && unitId.value
      ? await updateUnit(unitId.value, dto)
      : await createUnit(dto)
    if (saved) router.push({ name: 'organization-unit-detail', params: { id: saved.id } })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (isEdit.value && unitId.value) {
    router.push({ name: 'organization-unit-detail', params: { id: unitId.value } })
  } else {
    router.push({ name: 'organization-overview' })
  }
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="isEdit ? 'Edit Unit' : 'New Unit'" />

    <div class="space-y-5 sm:space-y-6">
      <ComponentCard
        :title="isEdit ? 'Edit Organization Unit' : 'New Organization Unit'"
        desc="Units build the company hierarchy: directorate → division → department → section → team."
      >
        <div v-if="loading && isEdit" class="flex justify-center py-10">
          <AppSpinner size="lg" />
        </div>

        <div v-else class="space-y-5">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Code" required :error="errors.code">
              <input v-model="form.code" type="text" placeholder="e.g. DIR-01" :class="INPUT_CLASS" :disabled="!canWrite" />
            </FormField>
            <FormField label="Name" required :error="errors.name">
              <input v-model="form.name" type="text" placeholder="e.g. Directorate of Operations" :class="INPUT_CLASS" :disabled="!canWrite" />
            </FormField>
            <FormField label="Type">
              <div class="relative">
                <select v-model="form.type" :class="SELECT_CLASS" :disabled="!canWrite">
                  <option v-for="t in UNIT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="Parent Unit" hint="Leave empty to create a root unit (e.g. the top-level directorate).">
              <div class="relative">
                <select v-model="form.parentId" :class="SELECT_CLASS" :disabled="!canWrite">
                  <option value="">— None (root unit) —</option>
                  <option v-for="u in parentOptions" :key="u.id" :value="u.id">{{ u.code }} · {{ u.name }}</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="Sort Order" hint="Lower numbers appear first in the tree.">
              <input v-model.number="form.sortOrder" type="number" min="0" :class="INPUT_CLASS" :disabled="!canWrite" />
            </FormField>
            <FormField label="Status">
              <div class="relative">
                <select v-model="form.isActive" :class="SELECT_CLASS" :disabled="!canWrite">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="Description" class="sm:col-span-2" :hint="selectedParentName ? `Under: ${selectedParentName}` : ''">
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Optional description of this unit's responsibility"
                :class="INPUT_CLASS"
                :disabled="!canWrite"
              />
            </FormField>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button variant="outline" size="sm" @click="handleCancel">Cancel</Button>
            <Button variant="primary" size="sm" :disabled="saving || !canWrite" @click="handleSave">
              {{ saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Unit' }}
            </Button>
          </div>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
