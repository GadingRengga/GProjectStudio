// src/stores/confirm.store.ts
// Pinia store — GLOBAL confirmation-dialog queue (single active request).
// Replaces native window.confirm(): promise-based, styled, and consistent
// with the app theme. The promise resolver lives in module scope on purpose —
// a function is not serializable state.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ConfirmTone = 'danger' | 'warning' | 'brand'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: ConfirmTone
}

export interface ConfirmRequest {
  id: number
  title: string
  message: string
  confirmText: string
  cancelText: string
  tone: ConfirmTone
}

let nextId = 1
let resolver: ((ok: boolean) => void) | null = null

export const useConfirmStore = defineStore('confirm', () => {
  const request = ref<ConfirmRequest | null>(null)
  const isOpen = computed(() => request.value !== null)

  function open(options: ConfirmOptions): Promise<boolean> {
    // Defensive: if a previous dialog was never answered, resolve it as cancelled.
    if (resolver) resolver(false)
    request.value = {
      id: nextId++,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText ?? 'Confirm',
      cancelText: options.cancelText ?? 'Cancel',
      tone: options.tone ?? 'danger',
    }
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function respond(ok: boolean) {
    resolver?.(ok)
    resolver = null
    request.value = null
  }

  return { request, isOpen, open, respond }
})
