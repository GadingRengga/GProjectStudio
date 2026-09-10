<!-- src/views/auth/LoginView.vue -->
<!-- View responsibilities: form state + navigation only. Auth logic lives in useAuth(). -->
<!-- FORBIDDEN in Views: importing supabase directly (docs/AI-GUIDELINES.md anti-patterns). -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import FormField from '@/components/molecules/FormField.vue'

const router = useRouter()
const route = useRoute()
const { login, loading } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

const isSubmitting = computed(() => loading.value)

async function handleSubmit() {
  errorMessage.value = ''
  const success = await login(email.value.trim(), password.value)
  if (success) {
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } else {
    errorMessage.value = 'Invalid email or password.'
  }
}
</script>

<template>
  <AuthLayout>
    <div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-semibold text-gray-800">Sign in</h1>
      <p class="mt-1 mb-6 text-sm text-gray-500">Welcome back. Please enter your credentials.</p>

      <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
        <FormField label="Email" required>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
          />
        </FormField>

        <FormField label="Password" required>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
          />
        </FormField>

        <p v-if="errorMessage" class="text-sm text-red-600" role="alert">{{ errorMessage }}</p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </AuthLayout>
</template>
