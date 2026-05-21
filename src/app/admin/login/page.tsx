import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { signInAction } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const configured = hasSupabaseEnv();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--blush-100)] p-5">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_18px_48px_rgba(80,40,30,0.1)]">
        <Link href="/" className="brand-display text-3xl italic text-[var(--toffee-800)]">originally</Link>
        <h1 className="brand-display mt-8 text-4xl text-[var(--toffee-800)]">Acesso admin</h1>
        <p className="mt-2 text-sm text-[var(--ink-500)]">Entre com um email autorizado no Supabase.</p>
        {!configured ? (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            Configure `.env.local` com Supabase para ativar login real.
          </div>
        ) : null}
        {params.error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">Email ou senha invalidos.</p> : null}
        <form action={signInAction} className="mt-6 grid gap-4">
          <label className="admin-field">
            <span>Email</span>
            <input className="admin-input" name="email" type="email" required />
          </label>
          <label className="admin-field">
            <span>Senha</span>
            <input className="admin-input" name="password" type="password" required />
          </label>
          <button className="btn btn-mint mt-2" disabled={!configured}>Entrar</button>
        </form>
      </div>
    </main>
  );
}
