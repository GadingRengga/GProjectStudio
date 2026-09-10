> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

## ⚙️ Config Files

### src/lib/supabase.ts
```typescript
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
```

### .env
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=ERP App
VITE_APP_VERSION=1.0.0
```

### netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

# Required for Vue Router history mode — routes all paths to index.html
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
