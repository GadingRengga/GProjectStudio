// src/composables/useToast.ts
// Thin wrapper around the global notification store.
// Composables (useCustomer, etc.) call this — components never touch the store directly.
import { useNotificationStore } from '@/stores/notification.store'

export function useToast() {
  const store = useNotificationStore()

  function success(message: string, timeout?: number) {
    store.push('success', message, timeout)
  }

  function error(message: string, timeout?: number) {
    store.push('error', message, timeout)
  }

  function info(message: string, timeout?: number) {
    store.push('info', message, timeout)
  }

  function warning(message: string, timeout?: number) {
    store.push('warning', message, timeout)
  }

  return { success, error, info, warning }
}
