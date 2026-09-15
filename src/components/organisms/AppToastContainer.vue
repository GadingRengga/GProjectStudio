<!-- src/components/organisms/AppToastContainer.vue -->
<!-- ORGANISM: renders the global notification store as stacked toasts in the TOP-RIGHT corner. -->
<!-- Mounted once in App.vue so toasts appear on every page (list, detail, form, auth). -->
<script setup lang="ts">
import type { Component } from 'vue'
import { useNotificationStore } from '@/stores/notification.store'
import type { NotificationType } from '@/stores/notification.store'
import { ErrorIcon, InfoCircleIcon, SuccessIcon, WarningIcon } from '@/icons'

const store = useNotificationStore()

const visuals: Record<NotificationType, { icon: Component; iconClass: string; borderClass: string; barClass: string }> = {
  success: {
    icon: SuccessIcon,
    iconClass: 'text-success-500',
    borderClass: 'border-success-500',
    barClass: 'bg-success-500',
  },
  error: {
    icon: ErrorIcon,
    iconClass: 'text-error-500',
    borderClass: 'border-error-500',
    barClass: 'bg-error-500',
  },
  warning: {
    icon: WarningIcon,
    iconClass: 'text-warning-500',
    borderClass: 'border-warning-500',
    barClass: 'bg-warning-500',
  },
  info: {
    icon: InfoCircleIcon,
    iconClass: 'text-blue-light-500',
    borderClass: 'border-blue-light-500',
    barClass: 'bg-blue-light-500',
  },
}
</script>

<template>
  <div
    aria-live="polite"
    class="pointer-events-none fixed top-5 right-5 z-[999999] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0"
  >
    <TransitionGroup name="toast">
      <div
        v-for="n in store.notifications"
        :key="n.id"
        class="pointer-events-auto overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-400/10 dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="flex items-start gap-3 border-l-4 p-4" :class="visuals[n.type].borderClass">
          <span :class="visuals[n.type].iconClass" class="mt-0.5 shrink-0">
            <component :is="visuals[n.type].icon" />
          </span>

          <p class="flex-1 text-sm text-gray-700 dark:text-gray-300">{{ n.message }}</p>

          <button
            type="button"
            aria-label="Dismiss notification"
            class="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            @click="store.remove(n.id)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <span
          v-if="n.timeout > 0"
          class="block h-0.5 origin-left"
          :class="visuals[n.type].barClass"
          :style="{ animation: `toast-progress ${n.timeout}ms linear forwards` }"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.95);
}
@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
