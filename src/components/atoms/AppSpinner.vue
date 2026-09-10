<!-- src/components/atoms/AppSpinner.vue -->
<!-- ATOM: no internal state, props-in/events-out, no composables (docs/COMPONENTS.md). -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)
</script>

<template>
  <span
    role="status"
    aria-live="polite"
    class="inline-block animate-spin rounded-full border-solid border-gray-300 border-t-blue-600"
    :class="{
      'h-4 w-4 border-2': size === 'sm',
      'h-8 w-8 border-[3px]': size === 'md',
      'h-12 w-12 border-4': size === 'lg',
    }"
  />
</template>
