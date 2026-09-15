<!-- src/components/organisms/OrgTree.vue -->
<!-- ORGANISM: recursive org-unit hierarchy tree. Props-in, events-out only. -->
<script setup lang="ts">
import { ref } from 'vue'
import type { OrgTreeNode } from '@/types/organization.types'
import AppBadge from '@/components/atoms/AppBadge.vue'
import Button from '@/components/ui/Button.vue'

defineOptions({ name: 'OrgTree' })

withDefaults(
  defineProps<{
    nodes: OrgTreeNode[]
    selectedId?: string | null
    canWrite?: boolean
    canDelete?: boolean
  }>(),
  { selectedId: null, canWrite: false, canDelete: false },
)

const emit = defineEmits<{
  select: [id: string]
  edit: [id: string]
  'add-child': [parentId: string]
  'toggle-active': [id: string, isActive: boolean]
  delete: [id: string]
}>()

const collapsed = ref<Set<string>>(new Set())

function isCollapsed(id: string): boolean {
  return collapsed.value.has(id)
}

function toggleCollapse(id: string) {
  if (collapsed.value.has(id)) collapsed.value.delete(id)
  else collapsed.value.add(id)
}

function typeVariant(type: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  switch (type) {
    case 'directorate':
      return 'warning'
    case 'division':
      return 'info'
    case 'department':
      return 'success'
    case 'section':
      return 'default'
    default:
      return 'default'
  }
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>

<template>
  <ul class="space-y-1">
    <li v-for="node in nodes" :key="node.id">
      <div
        class="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        :class="selectedId === node.id ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'"
        :style="{ marginLeft: `${node.level * 20}px` }"
      >
        <button
          v-if="node.children.length"
          type="button"
          class="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10"
          :aria-label="isCollapsed(node.id) ? 'Expand' : 'Collapse'"
          @click="toggleCollapse(node.id)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            class="transition-transform"
            :class="{ '-rotate-90': isCollapsed(node.id) }"
          >
            <path
              d="M3.5 5.25L7 8.75L10.5 5.25"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <span v-else class="w-6 shrink-0 text-center text-gray-300 dark:text-gray-700">•</span>

        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          @click="emit('select', node.id)"
        >
          <span class="mr-2 font-mono text-xs text-gray-400">{{ node.code }}</span>
          <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ node.name }}</span>
        </button>

        <AppBadge :variant="typeVariant(node.type)">{{ typeLabel(node.type) }}</AppBadge>
        <AppBadge :variant="node.isActive ? 'success' : 'danger'">
          {{ node.isActive ? 'Active' : 'Inactive' }}
        </AppBadge>

        <span v-if="canWrite" class="flex items-center gap-1" @click.stop>
          <Button variant="outline" size="sm" @click="emit('add-child', node.id)">+ Child</Button>
          <Button variant="outline" size="sm" @click="emit('edit', node.id)">Edit</Button>
          <Button
            variant="outline"
            size="sm"
            @click="emit('toggle-active', node.id, !node.isActive)"
          >
            {{ node.isActive ? 'Deactivate' : 'Activate' }}
          </Button>
          <Button
            v-if="canDelete"
            variant="outline"
            size="sm"
            class-name="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
            @click="emit('delete', node.id)"
          >
            Delete
          </Button>
        </span>
      </div>

      <OrgTree
        v-if="node.children.length && !isCollapsed(node.id)"
        :nodes="node.children"
        :selected-id="selectedId"
        :can-write="canWrite"
        :can-delete="canDelete"
        @select="emit('select', $event)"
        @edit="emit('edit', $event)"
        @add-child="emit('add-child', $event)"
        @toggle-active="(id, active) => emit('toggle-active', id, active)"
        @delete="emit('delete', $event)"
      />
    </li>
  </ul>
</template>
