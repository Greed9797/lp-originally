import { hasSupabaseEnv } from "@/lib/supabase/env";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "../admin-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (hasSupabaseEnv()) await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
