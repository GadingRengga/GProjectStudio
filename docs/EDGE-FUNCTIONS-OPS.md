> **To AI Assistants:** This file is part of a split `PROJECT.md`. Start with `README.md` for the full index and project context before reading this file. Do not change patterns here without a strong reason; ask the developer when something is ambiguous.

---

## ⚡ Edge Functions (For Secrets & Third-Party APIs)

Any operation needing a secret, a third-party API call, or server-side rate limiting goes here — never in the client. Example: sending an invoice email via Resend.

### supabase/functions/send-invoice-email/index.ts

```typescript
// supabase/functions/send-invoice-email/index.ts
// Deno runtime. Secrets are set via `supabase secrets set RESEND_API_KEY=...`
// and read with Deno.env — NEVER hardcoded, NEVER exposed to the client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  try {
    // 1. Verify the caller is authenticated (Edge Functions receive the caller's JWT)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 })
    }

    // 2. Client scoped to the caller — RLS still applies to any query this client makes
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
    }

    // 3. Parse input
    const { invoiceId } = await req.json()
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId is required' }), { status: 400 })
    }

    // 4. Fetch invoice — RLS on `invoices` still enforced because we used the scoped client
    const { data: invoice, error } = await supabaseClient
      .from('invoices')
      .select('*, customers(email, name)')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found or not accessible' }), { status: 404 })
    }

    // 5. Call the third-party API — secret only lives here, server-side
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'billing@yourcompany.com',
        to: invoice.customers.email,
        subject: `Invoice ${invoice.invoice_number}`,
        html: `<p>Dear ${invoice.customers.name}, your invoice total is ${invoice.total_amount}.</p>`,
      }),
    })

    if (!resendResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 })
  }
})
```

### Calling it from the client (composable)

```typescript
// src/composables/useInvoice.ts (excerpt)
async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('send-invoice-email', {
    body: { invoiceId },
  })
  if (error) {
    toast.error('Failed to send invoice email')
    return false
  }
  return true
}
```

**Rules for Edge Functions:**
- Deploy with `supabase functions deploy [name]`; set secrets with `supabase secrets set KEY=value` — never in `.env`/`VITE_*` variables.
- Always re-verify the caller's identity and re-check RLS-scoped data inside the function — do not trust anything the client claims about permissions.
- Keep functions small and single-purpose (one action per function), matching the "single responsibility" pattern used elsewhere in this architecture.

---

## 💾 Backup & Disaster Recovery Policy

- **Automatic backups:** Supabase takes daily automatic backups on paid plans (retention depends on plan tier — verify current retention in the Supabase dashboard before relying on a specific number of days).
- **Before any schema migration or bulk data operation:** take a manual backup via Supabase Dashboard → Settings → Database → Backups → Download, and keep it outside Supabase (local/cloud storage) for at least 30 days.
- **Who can restore:** restoring a backup is a destructive, project-wide action — restrict this to `admin` only, and require a second admin's sign-off before restoring in a shared/production project.
- **Audit logs are not a backup.** `audit_logs` (see above) lets you reconstruct what changed, but restoring from it is a manual, table-by-table replay — it is not a substitute for a real point-in-time backup.
- **Test the restore path at least once** before going to production — a backup that has never been restored is unverified.

---

## 🔁 Role Changes Mid-Session

Because `get_my_role()` queries the `user_roles` table live on every request (it is **not** baked into the JWT), a role change by an admin takes effect on the **very next query** the affected user makes — there is no stale-role caching to worry about at the database level.

However, two things still need explicit handling in the app:

1. **The Pinia `auth.store.ts` role/permission state is cached client-side** for UI rendering (`usePermission`). If an admin demotes a user while they're active, that user's UI won't reflect the new role until the store refreshes (next login, or a manual re-fetch). This is a UI staleness issue only — database access is already correctly restricted by RLS in the meantime, so it is not a security gap, just a UX one.
2. **For urgent role changes (e.g. revoking a compromised or terminated staff account),** don't rely on the natural refresh. Force sign-out immediately via `supabase.auth.admin.signOut(userId)` (called from an Edge Function using the `service_role` key, never from the client) so the session is invalidated right away rather than waiting for the user's next natural token refresh.

---



---

*Part of the ERP Web Application docs. See `README.md` for the full file index.*
