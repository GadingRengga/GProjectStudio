<!-- src/components/atoms/AppBadge.vue -->
<!-- ATOM: no internal state, props-in/events-out, no composables (docs/COMPONENTS.md). -->
<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}>()
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="{
      'bg-gray-100 text-gray-700': !variant || variant === 'default',
      'bg-green-100 text-green-700': variant === 'success',
      'bg-yellow-100 text-yellow-700': variant === 'warning',
      'bg-red-100 text-red-700': variant === 'danger',
      'bg-blue-100 text-blue-700': variant === 'info',
    }"
  >
    <slot />
  </span>
</template>
