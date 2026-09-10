<!-- src/components/atoms/AppAvatar.vue -->
<!-- ATOM: no internal state, props-in/events-out, no composables (docs/COMPONENTS.md). -->
<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    name?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { src: null, name: '', size: 'md' },
)

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/).filter(Boolean)
  const derived = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
  return derived || '?'
})

const sizeClass = computed(
  () =>
    ({
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-14 w-14 text-base',
    })[props.size],
)
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="name || 'Avatar'"
    class="rounded-full object-cover"
    :class="sizeClass"
  />
  <span
    v-else
    class="inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600"
    :class="sizeClass"
  >
    {{ initials }}
  </span>
</template>
