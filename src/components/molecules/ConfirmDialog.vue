<!-- src/components/molecules/ConfirmDialog.vue -->
<!-- MOLECULE: styled confirmation modal (props-in / events-out, no store access). -->
<!-- Overlay + centered panel, Escape cancels, confirm button focused on open. -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ConfirmTone } from '@/stores/confirm.store'
import { TriangleAlert } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

const props = withDefaults(
  defineProps<{
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    tone?: ConfirmTone
  }>(),
  { confirmText: 'Confirm', cancelText: 'Cancel', tone: 'danger' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const confirmButton = ref<{ $el: HTMLButtonElement } | null>(null)

const toneClasses: Record<ConfirmTone, { icon: string }> = {
  danger: { icon: 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-500' },
  warning: { icon: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500' },
  brand: { icon: 'bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400' },
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('cancel')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

watch(
  () => props.title,
  async () => {
    await nextTick()
    confirmButton.value?.$el?.focus()
  },
  { immediate: true },
)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="emit('cancel')"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex items-start gap-4">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            :class="toneClasses[tone].icon"
          >
            <TriangleAlert class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ title }}</h3>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ message }}</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" @click="emit('cancel')">
            {{ cancelText }}
          </Button>
          <Button
            ref="confirmButton"
            variant="primary"
            size="sm"
            :class-name="tone === 'danger' ? 'bg-error-500 hover:bg-error-600 disabled:bg-error-300' : ''"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
