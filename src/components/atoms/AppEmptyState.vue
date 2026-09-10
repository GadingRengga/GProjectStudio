<!-- src/components/atoms/AppEmptyState.vue -->
<!-- ATOM: no internal state, props-in/events-out, no composables (docs/COMPONENTS.md). -->
<script setup lang="ts">
defineProps<{
  message?: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-1 py-16 text-center">
    <p class="text-sm font-medium text-gray-700">{{ message ?? 'Nothing here yet' }}</p>
    <p v-if="description" class="max-w-sm text-xs text-gray-400">{{ description }}</p>
    <slot />
  </div>
</template>
