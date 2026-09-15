<!-- src/components/organisms/SummaryCard.vue -->
<!-- Generic summary card: title + 2x2 stat items side-by-side with its sibling chart card. -->
<!-- Visual tokens copied from EcommerceMetrics.vue (label/value) and MonthlyTarget.vue (footer separators). -->
<!-- Receives data via props only — no data fetching here. -->
<script setup lang="ts">
import type { Component } from 'vue'

export type SummaryTone = 'brand' | 'success' | 'error' | 'warning' | 'neutral'

export interface SummaryItem {
  label: string
  value: string | number
  /** Optional small colored icon chip shown next to the label. */
  icon?: Component
  /** Chip color. Defaults to 'neutral' when omitted. */
  tone?: SummaryTone
}

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    items: SummaryItem[]
  }>(),
  { title: '', subtitle: '' },
)

const toneClasses: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400',
  success: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
  error: 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500',
  neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}
</script>

<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-400/10 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  >
    <div v-if="title">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
      <p v-if="subtitle" class="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        {{ subtitle }}
      </p>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-x-6">
      <div
        v-for="(item, index) in items"
        :key="item.label"
        class="flex items-start gap-3"
        :class="index % 2 === 1 ? 'sm:border-l sm:border-gray-200 sm:pl-6 sm:dark:border-gray-800' : ''"
      >
        <span
          v-if="item.icon"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          :class="toneClasses[item.tone ?? 'neutral']"
        >
          <component :is="item.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ item.label }}</p>
          <p class="mt-1.5 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {{ item.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
