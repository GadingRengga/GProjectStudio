<!-- src/views/organization/UnitDetailView.vue -->
<!-- PAGE: unit detail + inline positions management + child units. -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrganization } from '@/composables/useOrganization'
import { usePermission } from '@/composables/usePermission'
import { useConfirm } from '@/composables/useConfirm'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import FormField from '@/components/molecules/FormField.vue'
import Button from '@/components/ui/Button.vue'
import AppBadge from '@/components/atoms/AppBadge.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import IconButton from '@/components/atoms/IconButton.vue'
import Alert from '@/components/ui/Alert.vue'
import DetailField from '@/components/molecules/DetailField.vue'
import { Pencil, Power, Trash2 } from 'lucide-vue-next'
import { PlusIcon } from '@/icons'
import type { OrganizationUnitType, Position, PositionLevel } from '@/types/organization.types'
import { formatDatetime } from '@/utils/date'
import { isRequired } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const {
  currentUnit,
  childUnits,
  positions,
  loading,
  error,
  fetchUnitById,
  fetchChildUnits,
  deleteUnit,
  toggleUnitActive,
  createPosition,
  updatePosition,
  togglePositionActive,
  deletePosition,
} = useOrganization()
const { can } = usePermission()
const { confirm } = useConfirm()

const unitId = computed(() => route.params.id as string)
const canCreate = computed(() => can('create', 'organization'))
const canUpdate = computed(() => can('update', 'organization'))
const canDelete = computed(() => can('delete', 'organization'))

const UNIT_TYPE_LABELS: Record<OrganizationUnitType, string> = {
  directorate: 'Directorate',
  division: 'Division',
  department: 'Department',
  section: 'Section',
  team: 'Team',
  unit: 'Unit',
}

const POSITION_LEVELS: { value: PositionLevel; label: string }[] = [
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'staff', label: 'Staff' },
  { value: 'intern', label: 'Intern' },
]

const INPUT_CLASS =
  'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

const SELECT_CLASS =
  'dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

function unitTypeVariant(type: OrganizationUnitType): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (type === 'directorate') return 'warning'
  if (type === 'division') return 'info'
  if (type === 'department') return 'success'
  return 'default'
}

function levelVariant(level: PositionLevel | null): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (level === 'director') return 'warning'
  if (level === 'manager') return 'info'
  if (level === 'staff') return 'success'
  return 'default'
}

function levelLabel(level: PositionLevel | null): string {
  if (!level) return '—'
  return POSITION_LEVELS.find((l) => l.value === level)?.label ?? level
}
async function load() {
  await fetchUnitById(unitId.value)
  void fetchChildUnits(unitId.value)
}

onMounted(load)

// ---- Positions: inline add/edit form -------------------------------------
const showPositionForm = ref(false)
const editingPositionId = ref<string | null>(null)
const savingPosition = ref(false)
const posForm = reactive({
  code: '',
  title: '',
  level: '' as PositionLevel | '',
  description: '',
  isActive: true,
})
const posErrors = reactive<Record<string, string>>({})

function openCreatePosition() {
  posForm.code = ''
  posForm.title = ''
  posForm.level = ''
  posForm.description = ''
  posForm.isActive = true
  posErrors.code = ''
  posErrors.title = ''
  editingPositionId.value = null
  showPositionForm.value = true
}

function openEditPosition(p: Position) {
  posForm.code = p.code
  posForm.title = p.title
  posForm.level = p.level ?? ''
  posForm.description = p.description ?? ''
  posForm.isActive = p.isActive
  posErrors.code = ''
  posErrors.title = ''
  editingPositionId.value = p.id
  showPositionForm.value = true
}

function closePositionForm() {
  showPositionForm.value = false
  editingPositionId.value = null
}

async function handleSavePosition() {
  posErrors.code = isRequired(posForm.code) ? '' : 'Code is required'
  posErrors.title = isRequired(posForm.title) ? '' : 'Title is required'
  if (posErrors.code || posErrors.title || savingPosition.value) return
  savingPosition.value = true
  try {
    // level: null on update clears it; undefined on create omits it.
    const base = {
      code: posForm.code,
      title: posForm.title,
      organizationUnitId: unitId.value,
      description: posForm.description,
      isActive: posForm.isActive,
    }
    const saved = editingPositionId.value
      ? await updatePosition(editingPositionId.value, { ...base, level: posForm.level || null })
      : await createPosition({ ...base, level: posForm.level || undefined })
    if (saved) closePositionForm()
  } finally {
    savingPosition.value = false
  }
}

// ---- Unit actions ---------------------------------------------------------
async function handleToggleUnitActive() {
  if (!canUpdate.value || !currentUnit.value) return
  await toggleUnitActive(unitId.value, !currentUnit.value.isActive)
}

async function handleDeleteUnit() {
  if (!canDelete.value) return
  const confirmed = await confirm({
    title: 'Delete Unit',
    message:
      'Units that still have child units or positions cannot be deleted — move or remove them first.',
    confirmText: 'Delete',
    tone: 'danger',
  })
  if (!confirmed) return
  const ok = await deleteUnit(unitId.value)
  if (ok) router.push({ name: 'organization-overview' })
}

async function handleDeletePosition(id: string) {
  if (!canDelete.value) return
  const confirmed = await confirm({
    title: 'Delete Position',
    message: 'This position will be permanently removed. This action cannot be undone.',
    confirmText: 'Delete',
    tone: 'danger',
  })
  if (!confirmed) return
  await deletePosition(id)
}

async function handleTogglePosition(p: Position) {
  if (!canUpdate.value) return
  await togglePositionActive(p.id, !p.isActive)
}

function goToEdit() {
  router.push({ name: 'organization-unit-edit', params: { id: unitId.value } })
}
function goToChild(id: string) {
  router.push({ name: 'organization-unit-detail', params: { id } })
}
function goToParent() {
  const parentId = currentUnit.value?.parentId
  if (parentId) goToChild(parentId)
  else router.push({ name: 'organization-overview' })
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Unit Detail'" />

    <div class="space-y-5 sm:space-y-6">
      <Alert
        v-if="error"
        variant="error"
        title="Organization action failed"
        :message="error"
      />

      <!-- Unit header -->
      <ComponentCard title="Organization Unit">
        <div v-if="loading" class="flex justify-center py-16">
          <AppSpinner size="lg" />
        </div>

        <div v-else-if="!currentUnit" class="py-10 text-center">
          <p class="font-medium text-gray-700 text-theme-sm dark:text-white/90">Unit not found</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">It may have been deleted or you lack access.</p>
        </div>

        <div v-else>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium tracking-wide text-gray-400 uppercase">
                {{ currentUnit.code }}
              </p>
              <h3 class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90 lg:text-2xl">
                {{ currentUnit.name }}
              </h3>
              <div class="mt-3 flex items-center gap-2">
                <AppBadge :variant="unitTypeVariant(currentUnit.type)">
                  {{ UNIT_TYPE_LABELS[currentUnit.type] }}
                </AppBadge>
                <AppBadge :variant="currentUnit.isActive ? 'success' : 'danger'">
                  {{ currentUnit.isActive ? 'Active' : 'Inactive' }}
                </AppBadge>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <IconButton
            v-if="canUpdate"
            :icon="Pencil"
            tooltip="Edit Unit"
            tone="brand"
            size="md"
            @click="goToEdit"
          />
          <IconButton
            v-if="canUpdate"
            :icon="Power"
            :tooltip="currentUnit.isActive ? 'Deactivate Unit' : 'Activate Unit'"
            :tone="currentUnit.isActive ? 'warning' : 'success'"
            size="md"
            @click="handleToggleUnitActive"
          />
          <IconButton
            v-if="canDelete"
            :icon="Trash2"
            tooltip="Delete Unit"
            tone="danger"
            size="md"
            @click="handleDeleteUnit"
          />
            </div>
          </div>
        </div>
      </ComponentCard>

      <!-- Unit info -->
      <ComponentCard v-if="currentUnit" title="Unit Information">
        <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <DetailField label="Parent Unit">
            <button
              type="button"
              class="text-brand-500 hover:underline"
              @click="goToParent"
            >
              {{ currentUnit.parentId ? 'Go to parent unit' : 'None (root unit)' }}
            </button>
          </DetailField>
          <DetailField label="Sort Order">{{ currentUnit.sortOrder }}</DetailField>
          <DetailField label="Description" wide>
            <span class="whitespace-pre-line font-normal">{{ currentUnit.description || '-' }}</span>
          </DetailField>
          <DetailField label="Created">{{ formatDatetime(currentUnit.createdAt) }}</DetailField>
          <DetailField label="Updated">{{ formatDatetime(currentUnit.updatedAt) }}</DetailField>
        </dl>
      </ComponentCard>
      <!-- Positions -->
      <ComponentCard
        v-if="currentUnit"
        title="Positions"
        desc="Job positions under this unit. Future employees will attach to a position here."
      >
        <div class="flex justify-end">
          <Button v-if="canCreate && !showPositionForm" variant="primary" size="sm" :start-icon="PlusIcon" @click="openCreatePosition">
            Add Position
          </Button>
        </div>

        <!-- Inline add/edit form -->
        <div v-if="showPositionForm" class="rounded-xl border border-gray-200 p-4 dark:border-gray-800 sm:p-5">
          <h4 class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ editingPositionId ? 'Edit Position' : 'New Position' }}
          </h4>
          <div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Code" required :error="posErrors.code">
              <input v-model="posForm.code" type="text" placeholder="e.g. MGR-OPS" :class="INPUT_CLASS" />
            </FormField>
            <FormField label="Title" required :error="posErrors.title">
              <input v-model="posForm.title" type="text" placeholder="e.g. Operations Manager" :class="INPUT_CLASS" />
            </FormField>
            <FormField label="Level">
              <div class="relative">
                <select v-model="posForm.level" :class="SELECT_CLASS">
                  <option value="">— None —</option>
                  <option v-for="l in POSITION_LEVELS" :key="l.value" :value="l.value">{{ l.label }}</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="Status">
              <div class="relative">
                <select v-model="posForm.isActive" :class="SELECT_CLASS">
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
            <FormField label="Description" class="sm:col-span-2">
              <textarea v-model="posForm.description" rows="2" placeholder="Optional description" :class="INPUT_CLASS" />
            </FormField>
          </div>
          <div class="mt-5 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" @click="closePositionForm">Cancel</Button>
            <Button variant="primary" size="sm" :disabled="savingPosition" @click="handleSavePosition">
              {{ savingPosition ? 'Saving…' : editingPositionId ? 'Save Changes' : 'Create Position' }}
            </Button>
          </div>
        </div>

        <!-- Positions table -->
        <div v-if="!positions.length" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No positions yet in this unit.
        </div>
        <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Code</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Title</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Level</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</p></th>
                <th class="px-5 py-3 text-right sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400"><span class="sr-only">Actions</span></p></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="p in positions" :key="p.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ p.code }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ p.title }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <AppBadge :variant="levelVariant(p.level)">{{ levelLabel(p.level) }}</AppBadge>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <AppBadge :variant="p.isActive ? 'success' : 'danger'">{{ p.isActive ? 'Active' : 'Inactive' }}</AppBadge>
                </td>
                <td class="px-5 py-4 sm:px-6" @click.stop>
                  <div class="flex items-center justify-end gap-2">
                    <IconButton v-if="canUpdate" :icon="Pencil" tooltip="Edit Position" tone="brand" @click="openEditPosition(p)" />
                    <IconButton
                      v-if="canUpdate"
                      :icon="Power"
                      :tooltip="p.isActive ? 'Deactivate Position' : 'Activate Position'"
                      :tone="p.isActive ? 'warning' : 'success'"
                      @click="handleTogglePosition(p)"
                    />
                    <IconButton
                      v-if="canDelete"
                      :icon="Trash2"
                      tooltip="Delete Position"
                      tone="danger"
                      @click="handleDeletePosition(p.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ComponentCard>

      <!-- Child units -->
      <ComponentCard
        v-if="currentUnit"
        title="Child Units"
        desc="Units directly under this unit."
      >
        <div v-if="!childUnits.length" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No child units under this unit yet.
        </div>
        <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="child in childUnits" :key="child.id">
            <button
              type="button"
              class="flex w-full flex-wrap items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              @click="goToChild(child.id)"
            >
              <span class="font-mono text-xs text-gray-400">{{ child.code }}</span>
              <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ child.name }}</span>
              <AppBadge :variant="unitTypeVariant(child.type)">{{ UNIT_TYPE_LABELS[child.type] }}</AppBadge>
              <AppBadge :variant="child.isActive ? 'success' : 'danger'">
                {{ child.isActive ? 'Active' : 'Inactive' }}
              </AppBadge>
            </button>
          </li>
        </ul>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
