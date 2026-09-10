<!-- src/views/dashboard/DashboardView.vue -->
<!-- Phase 0 placeholder — the real dashboard (StatCards, charts) is Phase 2 (docs/MIGRATION-ROADMAP.md). -->
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

const { currentUser, logout } = useAuth()
</script>

<template>
  <DashboardLayout>
    <div class="p-4 md:p-6">
      <h1 class="text-2xl font-semibold text-gray-800">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">
        Signed in as
        <span class="font-medium text-gray-700">{{ currentUser?.email ?? 'unknown' }}</span>
      </p>

      <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-8">
        <h2 class="text-base font-medium text-gray-700">Phase 0 — Foundation is in place 🎉</h2>
        <p class="mt-2 max-w-xl text-sm text-gray-500">
          Layouts, auth (login + route guards) and the base atom/molecule/organism kit are ready, and the
          repository folder structure is in place. Domain modules (Customer, Service, Order, Project,
          Invoice, Finance) arrive in Phase 1.
        </p>
        <button
          type="button"
          class="mt-4 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          @click="logout"
        >
          Sign out
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>
