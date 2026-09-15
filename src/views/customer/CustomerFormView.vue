<!-- src/views/customer/CustomerFormView.vue -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomer } from '@/composables/useCustomer'
import { usePermission } from '@/composables/usePermission'
import { useRegion } from '@/composables/useRegion'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import FormWizard, { type WizardStep } from '@/components/organisms/FormWizard.vue'
import FormField from '@/components/molecules/FormField.vue'
import type { CustomerType } from '@/types/customer.types'
import { isEmail, isPostalCode, isRequired } from '@/utils/validators'

const route = useRoute()
const router = useRouter()
const { currentCustomer, loading, fetchCustomerById, createCustomer, updateCustomer } = useCustomer()
const { can } = usePermission()
const {
  provinces,
  regencies,
  districts,
  villages,
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
} = useRegion()

const customerId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => Boolean(customerId.value))

const steps: WizardStep[] = [
  { title: 'Basic Info', subtitle: 'Identity & contact' },
  { title: 'Address', subtitle: 'Region hierarchy' },
  { title: 'Review', subtitle: 'Confirm & save' },
]
const currentStep = ref(0)

const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
  { value: 'company', label: 'Company' },
  { value: 'personal', label: 'Personal' },
  { value: 'institute', label: 'Institute' },
  { value: 'university', label: 'University' },
  { value: 'bumn', label: 'BUMN' },
]

const SELECT_CLASS =
  'dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

const form = reactive({
  code: '',
  name: '',
  email: '',
  phone: '',
  type: 'company' as CustomerType,
  isActive: true,
  country: 'Indonesia',
  provinceId: '',
  regencyId: '',
  districtId: '',
  villageId: '',
  street: '',
  postalCode: '',
})
const errors = reactive<Record<string, string>>({})
const saving = ref(false)

const canWrite = computed(() =>
  isEdit.value ? can('update', 'customers') : can('create', 'customers'),
)

const selectedProvinceName = computed(
  () => provinces.value.find((p) => p.id === form.provinceId)?.name ?? '',
)
const selectedRegencyName = computed(
  () => regencies.value.find((r) => r.id === form.regencyId)?.name ?? '',
)
const selectedDistrictName = computed(
  () => districts.value.find((d) => d.id === form.districtId)?.name ?? '',
)
const selectedVillageName = computed(
  () => villages.value.find((v) => v.id === form.villageId)?.name ?? '',
)

const canProceedStep0 = computed(
  () => isRequired(form.code) && isRequired(form.name) && (!form.email || isEmail(form.email)),
)
const canProceedStep1 = computed(() => !form.postalCode || isPostalCode(form.postalCode))

onMounted(async () => {
  await fetchProvinces()
  if (customerId.value) {
    await fetchCustomerById(customerId.value)
    const c = currentCustomer.value
    if (c) {
      form.code = c.code
      form.name = c.name
      form.email = c.email ?? ''
      form.phone = c.phone ?? ''
      form.type = c.type
      form.isActive = c.isActive
      form.country = c.country ?? 'Indonesia'
      form.street = c.address ?? ''
      form.postalCode = c.postalCode ?? ''
      // Rebuild the offline region chain top-down so dropdowns refill.
      if (c.provinceId) {
        form.provinceId = c.provinceId
        await fetchRegencies(c.provinceId)
        if (c.regencyId) {
          form.regencyId = c.regencyId
          await fetchDistricts(c.regencyId)
          if (c.districtId) {
            form.districtId = c.districtId
            await fetchVillages(c.districtId)
            if (c.villageId) form.villageId = c.villageId
          }
        }
      }
    }
  }
})

watch(
  () => form.provinceId,
  (next, prev) => {
    if (next === prev) return
    form.regencyId = ''
    form.districtId = ''
    form.villageId = ''
    if (next) void fetchRegencies(next)
  },
)

watch(
  () => form.regencyId,
  (next, prev) => {
    if (next === prev) return
    form.districtId = ''
    form.villageId = ''
    if (next) void fetchDistricts(next)
  },
)

watch(
  () => form.districtId,
  (next, prev) => {
    if (next === prev) return
    form.villageId = ''
    if (next) void fetchVillages(next)
  },
)

function validateAll(): boolean {
  errors.code = !isRequired(form.code) ? 'Code is required.' : ''
  errors.name = !isRequired(form.name) ? 'Name is required.' : ''
  errors.email = form.email && !isEmail(form.email) ? 'Enter a valid email address.' : ''
  errors.postalCode =
    form.postalCode && !isPostalCode(form.postalCode) ? 'Postal code must be 5 digits.' : ''
  return !errors.code && !errors.name && !errors.email && !errors.postalCode
}

function goNext() {
  if (currentStep.value === 0 && !canProceedStep0.value) {
    validateAll()
    return
  }
  if (currentStep.value === 1 && !canProceedStep1.value) {
    validateAll()
    return
  }
  if (currentStep.value < steps.length - 1) currentStep.value += 1
}

function goBackStep() {
  if (currentStep.value > 0) currentStep.value -= 1
}

function goToStep(index: number) {
  if (index >= 0 && index <= currentStep.value) currentStep.value = index
}

async function handleSubmit() {
  if (!canWrite.value || saving.value) return
  if (!validateAll()) return
  saving.value = true
  try {
    const dto = {
      code: form.code.trim(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      type: form.type,
      isActive: form.isActive,
      country: form.country.trim() || undefined,
      province: selectedProvinceName.value || undefined,
      provinceId: form.provinceId || undefined,
      regency: selectedRegencyName.value || undefined,
      regencyId: form.regencyId || undefined,
      district: selectedDistrictName.value || undefined,
      districtId: form.districtId || undefined,
      village: selectedVillageName.value || undefined,
      villageId: form.villageId || undefined,
      address: form.street.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
    }
    if (isEdit.value && customerId.value) {
      const updated = await updateCustomer(customerId.value, dto)
      if (updated) router.push({ name: 'customer-detail', params: { id: updated.id } })
    } else {
      const created = await createCustomer(dto)
      if (created) router.push({ name: 'customer-detail', params: { id: created.id } })
    }
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (isEdit.value && customerId.value) {
    router.push({ name: 'customer-detail', params: { id: customerId.value } })
  } else {
    router.push({ name: 'customer-list' })
  }
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="isEdit ? 'Edit Customer' : 'New Customer'" />

    <div class="space-y-5 sm:space-y-6">
      <ComponentCard :title="isEdit ? 'Edit Customer' : 'New Customer'">
        <p v-if="!canWrite" class="mb-5 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700" role="alert">
          You do not have permission to {{ isEdit ? 'update' : 'create' }} customers.
        </p>

        <FormWizard
          :steps="steps"
          :current-step="currentStep"
          :can-next="currentStep === 0 ? canProceedStep0 : currentStep === 1 ? canProceedStep1 : true"
          :saving="saving || loading"
          :submit-label="isEdit ? 'Save changes' : 'Create customer'"
          @next="goNext"
          @back="goBackStep"
          @goto="goToStep"
          @submit="handleSubmit"
          @cancel="goBack"
        >
          <template #step-0>
            <div class="flex flex-col gap-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Code" required :error="errors.code">
                  <input
                    v-model="form.code"
                    type="text"
                    placeholder="CUST-001"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </FormField>
              <FormField label="Type" required>
                <div class="relative">
                  <select v-model="form.type" :class="SELECT_CLASS">
                    <option v-for="t in CUSTOMER_TYPES" :key="t.value" :value="t.value">
                      {{ t.label }}
                    </option>
                  </select>
                  <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                </div>
              </FormField>
            </div>

            <FormField label="Name" required :error="errors.name">
              <input
                v-model="form.name"
                type="text"
                placeholder="PT Maju Jaya"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </FormField>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField label="Email" :error="errors.email">
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="contact@company.com"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </FormField>
              <FormField label="Phone">
              <input
                v-model="form.phone"
                type="tel"
                placeholder="+62 812 3456 7890"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </FormField>
          </div>

              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded border-gray-300" />
                Active customer
              </label>
            </div>
          </template>

          <!-- STEP 1: Address -->
          <template #step-1>
            <div class="flex flex-col gap-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Country">
                  <input
                    v-model="form.country"
                    type="text"
                    placeholder="Indonesia"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </FormField>
                <FormField label="Postal Code" :error="errors.postalCode" hint="5 digits">
                  <input
                    v-model="form.postalCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="5"
                    placeholder="10110"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </FormField>
              </div>
              <!--WIZARD_REGIONS-->
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="Province">
                  <div class="relative">
                    <select v-model="form.provinceId" :class="SELECT_CLASS">
                      <option value="">Select province</option>
                      <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>
                    <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                </FormField>
                <FormField label="Regency / City">
                  <div class="relative">
                    <select v-model="form.regencyId" :class="SELECT_CLASS" :disabled="!form.provinceId">
                      <option value="">Select regency / city</option>
                      <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
                    </select>
                    <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                </FormField>
              </div>
              <!--WIZARD_STREET-->
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField label="District">
                  <div class="relative">
                    <select v-model="form.districtId" :class="SELECT_CLASS" :disabled="!form.regencyId">
                      <option value="">Select district</option>
                      <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
                    </select>
                    <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                </FormField>
                <FormField label="Village">
                  <div class="relative">
                    <select v-model="form.villageId" :class="SELECT_CLASS" :disabled="!form.districtId">
                      <option value="">Select village</option>
                      <option v-for="v in villages" :key="v.id" :value="v.id">{{ v.name }}</option>
                    </select>
                    <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </div>
                </FormField>
              </div>
              <!--WIZARD_TAIL-->
              <FormField label="Street / Address Detail">
                <textarea
                  v-model="form.street"
                  rows="3"
                  placeholder="Jl. Sudirman No. 1, Gedung A Lt. 3"
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </FormField>
            </div>
          </template>
          <!--WIZARD_REVIEW-->
          <template #step-2>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Code</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.code || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Type</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm capitalize dark:text-white/90">{{ form.type }}</dd>
              </div>
              <!--WIZARD_REVIEW_B-->
              <div class="sm:col-span-2">
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Name</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.name || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Email</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.email || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Phone</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.phone || '-' }}</dd>
              </div>
              <!--WIZARD_REVIEW_C-->
              <div class="sm:col-span-2">
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Street</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.street || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Village</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ selectedVillageName || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">District</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ selectedDistrictName || '-' }}</dd>
              </div>
              <!--WIZARD_REVIEW_D-->
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Regency / City</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ selectedRegencyName || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Province</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ selectedProvinceName || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Postal Code</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.postalCode || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Country</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.country || '-' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Status</dt>
                <dd class="mt-1 text-gray-800 text-theme-sm dark:text-white/90">{{ form.isActive ? 'Active' : 'Inactive' }}</dd>
              </div>
            </dl>
          </template>
        </FormWizard>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>
