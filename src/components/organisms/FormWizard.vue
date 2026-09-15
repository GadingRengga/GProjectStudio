<!-- src/components/organisms/FormWizard.vue -->
<!-- ORGANISM: multi-step wizard shell. Generic — no domain knowledge. -->
<!-- Step content is provided via slots: step-0, step-1, ... -->
<script setup lang="ts">
import Button from '@/components/ui/Button.vue'

export interface WizardStep {
  title: string
  subtitle?: string
}

const props = defineProps<{
  steps: WizardStep[]
  currentStep: number
  canNext?: boolean
  saving?: boolean
  submitLabel?: string
  backToLabel?: string
}>()

const emit = defineEmits<{
  (e: 'next'): void
  (e: 'back'): void
  (e: 'goto', index: number): void
  (e: 'submit'): void
  (e: 'cancel'): void
}>()

const isLast = () => props.currentStep === props.steps.length - 1
</script>

<template>
  <div>
    <!-- Step indicator -->
    <ol class="mb-8 flex items-center">
      <li
        v-for="(step, i) in steps"
        :key="step.title"
        class="flex items-center"
        :class="i < steps.length - 1 ? 'flex-1' : ''"
      >
        <button
          type="button"
          :disabled="i > currentStep"
          class="group flex items-center gap-3 disabled:cursor-default"
          @click="emit('goto', i)"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
            :class="
              i < currentStep
                ? 'bg-brand-500 text-white'
                : i === currentStep
                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            "
          >
            <svg
              v-if="i < currentStep"
              class="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10.5L8.5 15L16 6.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="hidden text-left sm:block">
            <span
              class="block text-sm font-medium"
              :class="i <= currentStep ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-gray-500'"
            >
              {{ step.title }}
            </span>
            <span v-if="step.subtitle" class="block text-xs text-gray-500 dark:text-gray-400">
              {{ step.subtitle }}
            </span>
          </span>
        </button>
        <span
          v-if="i < steps.length - 1"
          class="mx-3 h-px flex-1 sm:mx-4"
          :class="i < currentStep ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-800'"
          aria-hidden="true"
        />
      </li>
    </ol>

    <!-- Step content -->
    <slot :name="`step-${currentStep}`" />

    <!-- Navigation -->
    <div class="mt-8 flex items-center justify-between border-t border-gray-100 pt-6 dark:border-gray-800">
      <div>
        <Button
          v-if="currentStep > 0"
          type="button"
          variant="outline"
          size="sm"
          @click="emit('back')"
        >
          Back
        </Button>
        <Button
          v-else
          type="button"
          variant="outline"
          size="sm"
          @click="emit('cancel')"
        >
          {{ backToLabel ?? 'Cancel' }}
        </Button>
      </div>
      <div class="flex items-center gap-3">
        <Button
          v-if="!isLast()"
          type="button"
          variant="primary"
          size="sm"
          :disabled="canNext === false"
          @click="emit('next')"
        >
          Continue
        </Button>
        <Button
          v-else
          type="button"
          variant="primary"
          size="sm"
          :disabled="saving"
          @click="emit('submit')"
        >
          {{ saving ? 'Saving…' : (submitLabel ?? 'Submit') }}
        </Button>
      </div>
    </div>
  </div>
</template>
