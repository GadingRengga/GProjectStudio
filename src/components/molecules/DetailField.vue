<!-- src/components/molecules/DetailField.vue -->
<!-- MOLECULE: one labelled detail row for <dl> grids on detail pages. -->
<!-- Props-in / slot-out only — receives already-formatted values from the View. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    /** Span both columns of the parent 2-column grid. */
    wide?: boolean
    /** Render the value in monospace (ids, codes). */
    mono?: boolean
  }>(),
  { wide: false, mono: false },
)
</script>

<template>
  <div :class="{ 'sm:col-span-2': wide }">
    <dt class="text-theme-xs font-medium tracking-wide text-gray-400 uppercase dark:text-gray-500">
      {{ label }}
    </dt>
    <dd
      class="mt-1 text-theme-sm font-medium break-words text-gray-800 dark:text-white/90"
      :class="{ 'font-mono text-xs break-all font-normal text-gray-500 dark:text-gray-400': mono }"
    >
      <slot />
    </dd>
  </div>
</template>
