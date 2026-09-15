<!-- src/components/organisms/SummaryCard.vue -->
<!-- Generic summary card: title + 2x2 stat items side-by-side with its sibling chart card. -->
<!-- Visual tokens copied from EcommerceMetrics.vue (label/value) and MonthlyTarget.vue (footer separators). -->
<!-- Receives data via props only — no data fetching here. -->
<script setup lang="ts">
export interface SummaryItem {
  label: string
  value: string | number
}

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    items: SummaryItem[]
  }>(),
  { title: '', subtitle: '' },
)
</script>

<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  >
    <div v-if="title">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
      <p v-if="subtitle" class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        {{ subtitle }}
      </p>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-4 sm:gap-6">
      <div v-for="(item, index) in items" :key="item.label" class="flex gap-4 sm:gap-6">
        <div
          v-if="index % 2 === 1"
          class="w-px shrink-0 bg-gray-200 dark:bg-gray-800"
          aria-hidden="true"
        />
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.label }}</p>
          <p class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {{ item.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
