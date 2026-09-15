<!-- src/components/organisms/AppConfirmHost.vue -->
<!-- ORGANISM: single mount point (App.vue) that renders the global confirm dialog -->
<!-- driven by stores/confirm.store.ts. Views only talk to useConfirm(). -->
<script setup lang="ts">
import { useConfirmStore } from '@/stores/confirm.store'
import ConfirmDialog from '@/components/molecules/ConfirmDialog.vue'

const store = useConfirmStore()
</script>

<template>
  <ConfirmDialog
    v-if="store.request"
    :key="store.request.id"
    :title="store.request.title"
    :message="store.request.message"
    :confirm-text="store.request.confirmText"
    :cancel-text="store.request.cancelText"
    :tone="store.request.tone"
    @confirm="store.respond(true)"
    @cancel="store.respond(false)"
  />
</template>
