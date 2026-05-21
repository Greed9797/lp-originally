import Link from "next/link";
import { signOutAction } from "./actions";

const nav = [
  ["Dashboard", "/admin"],
  ["Produtos", "/admin/produtos"],
  ["Categorias", "/admin/categorias"],
  ["Vitrines", "/admin/vitrines"],
  ["Configuracoes", "/admin/configuracoes"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f8eeec]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[rgba(84,53,24,0.1)] bg-white p-6 lg:block">
        <Link href="/" className="brand-display text-3xl italic text-[var(--toffee-800)]">originally</Link>
        <nav className="mt-10 grid gap-2">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-2xl px-4 py-3 text-sm font-black text-[var(--ink-700)] hover:bg-[var(--blush-100)]">
              {label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="absolute bottom-6 left-6 right-6">
          <button className="btn btn-ghost w-full text-sm">Sair</button>
        </form>
      </aside>
      <section className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
