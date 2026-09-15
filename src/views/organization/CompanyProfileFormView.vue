<!-- src/views/organization/CompanyProfileFormView.vue -->
<!-- PAGE: edit the singleton company identity (admin only per RLS). -->
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganization } from '@/composables/useOrganization'
import { usePermission } from '@/composables/usePermission'
import { useRegion } from '@/composables/useRegion'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import FormField from '@/components/molecules/FormField.vue'
import Button from '@/components/ui/Button.vue'
import AppSpinner from '@/components/atoms/AppSpinner.vue'
import { isEmail, isPostalCode, isRequired } from '@/utils/validators'

const router = useRouter()
const { profile, loading, fetchProfile, saveProfile } = useOrganization()
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

// Mirrors the DB gate: company_profile UPDATE is admin-only per RLS.
const canUpdate = computed(() => can('update', 'company_profile'))

const INPUT_CLASS =
  'dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

const SELECT_CLASS =
  'dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800'

const form = reactive({
  name: '',
  legalName: '',
  tagline: '',
  logoUrl: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  country: 'Indonesia',
  provinceId: '',
  regencyId: '',
  districtId: '',
  villageId: '',
  postalCode: '',
  npwp: '',
  nib: '',
  siup: '',
})
const errors = reactive<Record<string, string>>({})
const saving = ref(false)
const initialLoading = ref(true)

onMounted(async () => {
  await fetchProvinces()
  await fetchProfile()
  const p = profile.value
  if (p) {
    form.name = p.name
    form.legalName = p.legalName ?? ''
    form.tagline = p.tagline ?? ''
    form.logoUrl = p.logoUrl ?? ''
    form.email = p.email ?? ''
    form.phone = p.phone ?? ''
    form.website = p.website ?? ''
    form.address = p.address ?? ''
    form.country = p.country ?? 'Indonesia'
    form.provinceId = p.provinceId ?? ''
    form.regencyId = p.regencyId ?? ''
    form.districtId = p.districtId ?? ''
    form.villageId = p.villageId ?? ''
    form.postalCode = p.postalCode ?? ''
    form.npwp = p.npwp ?? ''
    form.nib = p.nib ?? ''
    form.siup = p.siup ?? ''
    // Rebuild the region chain so each select shows the saved option.
    if (p.provinceId) await fetchRegencies(p.provinceId)
    if (p.regencyId) await fetchDistricts(p.regencyId)
    if (p.districtId) await fetchVillages(p.districtId)
  }
  initialLoading.value = false
})

function onProvinceChange() {
  form.regencyId = ''
  form.districtId = ''
  form.villageId = ''
  if (form.provinceId) void fetchRegencies(form.provinceId)
}
function onRegencyChange() {
  form.districtId = ''
  form.villageId = ''
  if (form.regencyId) void fetchDistricts(form.regencyId)
}
function onDistrictChange() {
  form.villageId = ''
  if (form.districtId) void fetchVillages(form.districtId)
}

function validate(): boolean {
  errors.name = isRequired(form.name) ? '' : 'Company name is required'
  errors.email = !form.email || isEmail(form.email) ? '' : 'Invalid email format'
  errors.postalCode = !form.postalCode || isPostalCode(form.postalCode) ? '' : 'Postal code must be 5 digits'
  return !errors.name && !errors.email && !errors.postalCode
}
async function handleSave() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    // Names are resolved from the loaded region lists so the stored
    // *_id and *_name pairs always stay consistent.
    const provinceName = provinces.value.find((x) => x.id === form.provinceId)?.name ?? null
    const regencyName = regencies.value.find((x) => x.id === form.regencyId)?.name ?? null
    const districtName = districts.value.find((x) => x.id === form.districtId)?.name ?? null
    const villageName = villages.value.find((x) => x.id === form.villageId)?.name ?? null

    const saved = await saveProfile({
      name: form.name,
      legalName: form.legalName || null,
      tagline: form.tagline || null,
      logoUrl: form.logoUrl || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      address: form.address || null,
      country: form.country || 'Indonesia',
      province: provinceName,
      provinceId: form.provinceId || null,
      regency: regencyName,
      regencyId: form.regencyId || null,
      district: districtName,
      districtId: form.districtId || null,
      village: villageName,
      villageId: form.villageId || null,
      postalCode: form.postalCode || null,
      npwp: form.npwp || null,
      nib: form.nib || null,
      siup: form.siup || null,
    })
    if (saved) router.push({ name: 'organization-overview' })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push({ name: 'organization-overview' })
}
</script>

<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="'Edit Company Profile'" />

    <div class="space-y-5 sm:space-y-6">
      <div v-if="initialLoading || loading" class="flex justify-center py-16">
        <AppSpinner size="lg" />
      </div>

      <div v-else class="space-y-5 sm:space-y-6">
        <div
          v-if="!canUpdate"
          class="rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
        >
          Only admins can edit the company profile. Your changes will be rejected by the database.
        </div>

        <!-- Identity -->
        <ComponentCard title="Identity" desc="Legal name shown on documents and reports.">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Company Name" required :error="errors.name">
              <input v-model="form.name" type="text" placeholder="e.g. GProject Studio" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Legal Name" hint="Name on the deed / NIB (optional).">
              <input v-model="form.legalName" type="text" placeholder="e.g. PT Gading Project Studio" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Tagline">
              <input v-model="form.tagline" type="text" placeholder="e.g. Building better software" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Logo URL" hint="Public image URL (Supabase Storage or CDN).">
              <input v-model="form.logoUrl" type="text" placeholder="https://…" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
          </div>
        </ComponentCard>

        <!-- Contact -->
        <ComponentCard title="Contact">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Email" :error="errors.email">
              <input v-model="form.email" type="email" placeholder="office@company.com" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Phone">
              <input v-model="form.phone" type="text" placeholder="+62 21 5555 5555" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Website">
              <input v-model="form.website" type="text" placeholder="https://company.com" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
          </div>
        </ComponentCard>

        <!-- Address -->
        <ComponentCard title="Address" desc="Registered company address (region data from the Indonesia Region API).">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Street Address" class="sm:col-span-2">
              <textarea v-model="form.address" rows="2" placeholder="Building, street, number" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Province">
              <div class="relative">
                <select v-model="form.provinceId" :class="SELECT_CLASS" :disabled="!canUpdate" @change="onProvinceChange">
                  <option value="">— Select province —</option>
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
                <select v-model="form.regencyId" :class="SELECT_CLASS" :disabled="!canUpdate || !form.provinceId" @change="onRegencyChange">
                  <option value="">— Select regency / city —</option>
                  <option v-for="r in regencies" :key="r.id" :value="r.id">{{ r.name }}</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="District">
              <div class="relative">
                <select v-model="form.districtId" :class="SELECT_CLASS" :disabled="!canUpdate || !form.regencyId" @change="onDistrictChange">
                  <option value="">— Select district —</option>
                  <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="Village / Urban">
              <div class="relative">
                <select v-model="form.villageId" :class="SELECT_CLASS" :disabled="!canUpdate || !form.districtId">
                  <option value="">— Select village —</option>
                  <option v-for="v in villages" :key="v.id" :value="v.id">{{ v.name }}</option>
                </select>
                <span class="pointer-events-none absolute top-1/2 right-4 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </div>
            </FormField>
            <FormField label="Postal Code" :error="errors.postalCode">
              <input v-model="form.postalCode" type="text" inputmode="numeric" maxlength="5" placeholder="12345" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="Country">
              <input v-model="form.country" type="text" placeholder="Indonesia" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
          </div>
        </ComponentCard>

        <!-- Legal registration -->
        <ComponentCard title="Legal Registration" desc="Shown on invoices and official documents.">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="NPWP">
              <input v-model="form.npwp" type="text" placeholder="00.000.000.0-000.000" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="NIB">
              <input v-model="form.nib" type="text" placeholder="OSS identifier" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
            <FormField label="SIUP">
              <input v-model="form.siup" type="text" placeholder="Trading license number" :class="INPUT_CLASS" :disabled="!canUpdate" />
            </FormField>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
            <Button variant="outline" size="sm" @click="handleCancel">Cancel</Button>
            <Button variant="primary" size="sm" :disabled="saving || !canUpdate" @click="handleSave">
              {{ saving ? 'Saving…' : 'Save Profile' }}
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  </AdminLayout>
</template>
