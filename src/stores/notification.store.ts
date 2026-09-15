// src/stores/notification.store.ts
// Pinia store — GLOBAL notification/toast queue.
// Views/composables push messages here; a toast UI organism renders them.
// Local one-off messages stay local — only cross-view messages belong here.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationItem {
  id: number
  type: NotificationType
  message: string
  timeout: number
}

let nextId = 1

export const useNotificationStore = defineStore('notification', () => {
  const items = ref<NotificationItem[]>([])

  const notifications = computed(() => items.value)

  function push(type: NotificationType, message: string, timeout = 4000) {
    const id = nextId++
    items.value.push({ id, type, message, timeout })
    if (timeout > 0) {
      window.setTimeout(() => remove(id), timeout)
    }
    return id
  }

  function remove(id: number) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function clear() {
    items.value = []
  }

  return { items, notifications, push, remove, clear }
})
