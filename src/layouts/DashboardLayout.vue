<!-- src/layouts/DashboardLayout.vue -->
<!-- Template level (Atomic Design): page skeleton only — sidebar + header + <router-view> content via slot. -->
<!-- TailAdmin already provides the shell (docs/COMPONENTS.md decision tree) — reuse it, do not rebuild. -->
<script setup lang="ts">
import AdminLayout from '@/components/layout/AdminLayout.vue'
</script>

<template>
  <AdminLayout>
    <slot />
  </AdminLayout>
</template>
