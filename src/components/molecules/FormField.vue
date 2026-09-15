<!-- src/components/molecules/FormField.vue -->
<!-- MOLECULE: 2–5 atoms forming one UI function; lightweight local state only. -->
<!-- FORBIDDEN: importing data composables, calling repositories (docs/COMPONENTS.md). -->
<script setup lang="ts">
defineProps<{
  label: string
  error?: string
  required?: boolean
  hint?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      {{ label }}
      <span v-if="required" class="ml-1 text-red-500" aria-hidden="true">*</span>
    </label>
    <slot />
    <p v-if="hint && !error" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ hint }}</p>
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>
