import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,

  {
    name: 'app/supabase-import-boundary',
    files: ['src/**/*.{ts,mts,tsx,vue}'],
    // useAuth.ts is the ONE documented exception (docs/DATA-LAYER.md: on auth
    // migration "change ONLY this file and lib/supabase.ts").
    ignores: ['src/lib/**', 'src/repositories/supabase/**', 'src/composables/useAuth.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/supabase', '@/lib/supabase/*', '**/lib/supabase'],
              message:
                'Architecture Rule #1: the Supabase client may only be imported inside src/repositories/supabase/ and src/lib/supabase.ts (composables/useAuth.ts is the one documented exception for auth).',
            },
          ],
        },
      ],
    },
  },
)
