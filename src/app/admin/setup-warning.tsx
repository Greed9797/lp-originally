import { hasSupabaseEnv } from "@/lib/supabase/env";

export function SetupWarning() {
  if (hasSupabaseEnv()) return null;
  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      Supabase ainda nao esta configurado. As paginas publicas usam dados de exemplo; o admin real precisa das variaveis em `.env.local`.
    </div>
  );
}
