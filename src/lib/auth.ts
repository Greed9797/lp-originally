import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "./supabase/env";
import { createSupabaseServerClient } from "./supabase/server";

export async function getCurrentAdmin() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (configuredAdminEmail && user.email.toLowerCase() === configuredAdminEmail) {
    return {
      user,
      profile: {
        id: user.id,
        email: user.email,
        role: "owner",
      },
    };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .eq("active", true)
    .maybeSingle();

  return profile ? { user, profile } : null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
