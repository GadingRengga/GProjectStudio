// src/repositories/index.ts
// =====================================================================
// THIS IS THE ONLY FILE THAT CHANGES DURING DATABASE MIGRATION.
// Swap the import source from './supabase/' to your new provider folder
// (docs/DATA-LAYER.md Step 5, docs/MIGRATION-ROADMAP.md "Migration Steps").
// =====================================================================
//
// Phase 0: no domain modules exist yet — repositories get registered here in
// Phase 1 as each module is built, in this exact order per module:
//   1. src/types/[module].types.ts
//   2. repositories/interfaces/I[Module]Repository.ts
//   3. repositories/supabase/Supabase[Module]Repository.ts
//   4. register here, e.g.:
//      export const customerRepository: ICustomerRepository = new SupabaseCustomerRepository()
//   5. composables/use[Module].ts
//   6. Views (List → Detail → Form)

import { SupabaseCustomerRepository } from './supabase/SupabaseCustomerRepository'
import { SupabaseServiceRepository } from './supabase/SupabaseServiceRepository'
import type { ICustomerRepository } from './interfaces/ICustomerRepository'
import type { IServiceRepository } from './interfaces/IServiceRepository'

// To migrate: replace "new SupabaseXxxRepository()" with "new RestXxxRepository()" etc.
export const customerRepository: ICustomerRepository = new SupabaseCustomerRepository()
export const serviceRepository: IServiceRepository = new SupabaseServiceRepository()
