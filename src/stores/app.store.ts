// src/stores/app.store.ts
// Pinia store — GLOBAL UI state only (sidebar, global loading, theme).
// Local state stays in composables/components (docs/AI-GUIDELINES.md checklist #3).
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type AppTheme = 'light' | 'dark'

export const useAppStore = defineStore('app', () => {
  const sidebarOpen = ref(true)
  const globalLoading = ref(false)
  const theme = ref<AppTheme>('light')

  const isSidebarOpen = computed(() => sidebarOpen.value)
  const isLoading = computed(() => globalLoading.value)

  function setSidebarOpen(open: boolean) {
    sidebarOpen.value = open
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setGlobalLoading(loading: boolean) {
    globalLoading.value = loading
  }

  function setTheme(next: AppTheme) {
    theme.value = next
  }

  return {
    sidebarOpen,
    globalLoading,
    theme,
    isSidebarOpen,
    isLoading,
    setSidebarOpen,
    toggleSidebar,
    setGlobalLoading,
    setTheme,
  }
})
