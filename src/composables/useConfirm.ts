// src/composables/useConfirm.ts
// Promise-based confirmation dialog. Views await confirm({...}) which resolves
// true (confirmed) or false (cancelled) — a styled replacement for window.confirm.
// UI renders via AppConfirmHost (mounted once in App.vue).
import { useConfirmStore } from '@/stores/confirm.store'
import type { ConfirmOptions } from '@/stores/confirm.store'

export function useConfirm() {
  const store = useConfirmStore()

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return store.open(options)
  }

  return { confirm }
}
