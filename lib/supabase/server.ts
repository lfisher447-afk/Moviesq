import { createClient as createSyncClient } from "./client"

export async function createClient() {
  // Routes to the existing Supabase logic wrapped around Firebase
  return createSyncClient()
}

// Bypassing specific Next.js app router cookie logic which gets invoked by standard supabase-js wrappers
export async function createRouteHandlerClient() {
  return createSyncClient()
}
