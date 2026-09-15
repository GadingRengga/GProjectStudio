<!-- src/components/molecules/MetricCard.vue -->
<!-- Reusable summary card. Visual pattern extracted VERBATIM from EcommerceMetrics.vue. -->
<!-- Receives data via props only — no data fetching here. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    delta?: string
    deltaTone?: 'up' | 'down' | 'neutral'
  }>(),
  { delta: '', deltaTone: 'neutral' },
)

const deltaClasses: Record<string, string> = {
  up: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500',
  down: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  neutral: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}
</script>

<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
    >
      <slot name="icon">
        <svg
          class="fill-gray-800 dark:fill-white/90"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm-6 4.5a6 6 0 1 1 12 0c0 3.314-2.686 6-6 6s-6-2.686-6-6ZM4 20.5c0-3.038 3.134-5 8-5s8 1.962 8 5v.5H4v-.5Z"
            fill=""
          />
        </svg>
      </slot>
    </div>

    <div class="mt-5 flex items-end justify-between">
      <div>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</span>
        <h4 class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {{ value }}
        </h4>
      </div>

      <span
        v-if="delta"
        class="flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium"
        :class="deltaClasses[deltaTone]"
      >
        {{ delta }}
      </span>
    </div>
  </div>
</template>
