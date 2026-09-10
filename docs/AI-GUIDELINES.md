> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

## ✅ AI Checklist: Before Writing Any Code

Answer these questions before generating code for any task:

**1. Is this a UI component?**
- Does TailAdmin already have it? → Use TailAdmin.
- Not in TailAdmin? → Determine the atomic level first (atom / molecule / organism), then create in the correct folder.

**2. Does this need database access?**
- Create/verify Repository Interface in `repositories/interfaces/`
- Create Supabase implementation in `repositories/supabase/`
- Register in `repositories/index.ts`
- Wrap in a composable `composables/use[Name].ts`
- Call from View via composable only

**3. Is this global or local state?**
- Needed in many places (user session, sidebar) → Pinia store
- Needed in only 1–2 components → `ref/reactive` local to composable or component

**4. Does this data have a TypeScript interface?**
- Not yet? → Create in `src/types/` before anything else.

**5. Is the naming convention correct?**
- Check the naming table in the Atomic Design section above.

**6. Does this feature need a permission check?**
- UI gate → use `can()` from `usePermission()` composable
- Database gate → ensure the correct RLS policy exists (both are required)

**7. Is this a sensitive operation (finance, delete, role management)?**
- Verify the RLS policy restricts to `admin` role only
- Verify an audit trigger exists for the affected table

**8. Does this operation need a secret, a third-party API call, or rate limiting?**
- Yes → build it as a Supabase Edge Function in `supabase/functions/`, never from the client
- No → proceed with the normal repository flow

**9. Did you test the new/changed RLS policy per role?**
- Run the query as `admin`, `staff`, and `viewer` and confirm only the expected rows return
- A policy that "wasn't tested by role" is not considered done

---

## 🚫 Anti-Patterns — Never Do These

```typescript
// ❌ WRONG: Importing supabase directly in a View
import { supabase } from '@/lib/supabase'
const { data } = await supabase.from('customers').select()

// ✅ CORRECT: Use the composable
const { customers, fetchCustomers } = useCustomer()
await fetchCustomers({ page: 1, perPage: 15 })
```

```typescript
// ❌ WRONG: Importing repository directly in an Organism
import { customerRepository } from '@/repositories'
const customers = await customerRepository.findAll(...)

// ✅ CORRECT: Organism receives data via props from View
defineProps<{ customers: Customer[] }>()
```

```vue
<!-- ❌ WRONG: Business logic in template -->
<template>
  <div v-if="user.role === 'admin' && invoice.status !== 'paid' && invoice.totalAmount > 0">
    Show payment button
  </div>
</template>

<!-- ✅ CORRECT: Logic in computed, template only renders -->
<script setup>
const showPaymentButton = computed(() =>
  user.value?.role === 'admin'
  && invoice.value?.status !== 'paid'
  && (invoice.value?.totalAmount ?? 0) > 0
)
</script>
<template>
  <div v-if="showPaymentButton">Show payment button</div>
</template>
```

```typescript
// ❌ WRONG: Security enforced only at UI level
function handleDelete(id: string) {
  if (userRole !== 'admin') return  // ← This can be bypassed in DevTools
  deleteCustomer(id)
}

// ✅ CORRECT: UI gate AND database gate (both required)
// UI gate (usePermission) — for good UX, hides buttons from non-admins
function handleDelete(id: string) {
  if (!can('delete', 'customers')) return
  deleteCustomer(id)
}
// Database gate (RLS policy) — the real security, cannot be bypassed
// CREATE POLICY "customers_delete" ON customers FOR DELETE TO authenticated
//   USING (get_my_role() = 'admin');
```

```typescript
// ❌ WRONG: Atom with its own data fetching
// atoms/AppUserLabel.vue
const { currentUser } = useAuth()  // Atom must NOT do this

// ✅ CORRECT: Atom only receives props
defineProps<{ name: string; avatarUrl?: string }>()
```

```typescript
// ❌ WRONG: Putting a third-party secret in a VITE_ env var
// .env
// VITE_RESEND_API_KEY=re_xxxxx   ← bundled into the public client build, fully exposed

// ❌ WRONG: Calling a payment gateway or email API directly from a composable
async function sendInvoiceEmail(invoiceId: string) {
  await fetch('https://api.resend.com/emails', { headers: { Authorization: 'Bearer re_xxxxx' } })
}

// ✅ CORRECT: Secret lives only in the Edge Function's environment, client calls the function
// supabase/functions/send-invoice-email/index.ts holds the secret (Deno.env.get('RESEND_API_KEY'))
async function sendInvoiceEmail(invoiceId: string) {
  await supabase.functions.invoke('send-invoice-email', { body: { invoiceId } })
}
```

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
