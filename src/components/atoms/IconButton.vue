<!-- src/components/atoms/IconButton.vue -->
<!-- ATOM: no internal state, props-in/events-out, no composables (docs/COMPONENTS.md). -->
<!-- Colored icon-only button with a hover text tooltip (no external tooltip lib). -->
<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon: Component
    /** Hover text (also used as the accessible label). */
    tooltip: string
    tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
    size?: 'sm' | 'md'
    disabled?: boolean
    tooltipPlacement?: 'top' | 'bottom'
  }>(),
  {
    tone: 'neutral',
    size: 'sm',
    disabled: false,
    tooltipPlacement: 'top',
  },
)

const emit = defineEmits<{ click: [] }>()

const toneClasses: Record<string, string> = {
  brand:
    'bg-brand-50 text-brand-500 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20',
  success:
    'bg-success-50 text-success-600 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-500 dark:hover:bg-success-500/20',
  warning:
    'bg-warning-50 text-warning-600 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-500 dark:hover:bg-warning-500/20',
  danger:
    'bg-error-50 text-error-600 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-500 dark:hover:bg-error-500/20',
  neutral:
    'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
}

const sizeClasses: Record<string, string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
}

const iconSizeClasses: Record<string, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}
</script>

<template>
  <span class="group relative inline-flex">
    <button
      type="button"
      :disabled="disabled"
      :aria-label="tooltip"
      :class="[
        'inline-flex items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        sizeClasses[size],
        toneClasses[tone],
        { 'cursor-not-allowed opacity-40': disabled },
      ]"
      @click="emit('click')"
    >
      <component :is="icon" :class="iconSizeClasses[size]" />
    </button>

    <!-- Hover text -->
    <span
      role="tooltip"
      class="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-gray-700"
      :class="tooltipPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
    >
      {{ tooltip }}
      <span
        class="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-700"
        :class="tooltipPlacement === 'top' ? '-bottom-1' : '-top-1'"
        aria-hidden="true"
      />
    </span>
  </span>
</template>
