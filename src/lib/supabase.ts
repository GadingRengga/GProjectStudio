// src/lib/supabase.ts
// The Supabase client. ONLY allowed to be imported in src/repositories/supabase/*
// (and composables/useAuth.ts for auth flows — see docs/DATA-LAYER.md).
// Enforced by the ESLint rule "app/supabase-import-boundary" in eslint.config.ts.
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
