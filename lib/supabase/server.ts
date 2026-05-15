import { createClient as createSyncClient } from "./client"

export async function createClient() {
  // Routes to the existing Supabase logic wrapped around Firebase
  return createSyncClient()
}

export async function createRouteHandlerClient() {
  return createSyncClient()
}
