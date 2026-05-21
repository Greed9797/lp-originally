"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey } from "./env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabasePublishableKey()!,
  );
}
