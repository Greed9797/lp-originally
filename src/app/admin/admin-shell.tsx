import Link from "next/link";
import { signOutAction } from "./actions";

const nav = [
  ["Dashboard", "/admin"],
  ["Produtos", "/admin/produtos"],
  ["Categorias", "/admin/categorias"],
  ["Vitrines", "/admin/vitrines"],
  ["Instagram", "/admin/instagram"],
  ["Contatos", "/admin/contatos"],
  ["Importacao", "/admin/importacao"],
  ["Configuracoes", "/admin/configuracoes"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f6f6f7] text-[#202223]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#e1e3e5] bg-[#fbfbfb] p-4 lg:block">
        <Link href="/" className="brand-display block px-3 py-2 text-3xl italic text-[var(--toffee-800)]">originally</Link>
        <nav className="mt-7 grid gap-1">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#303030] hover:bg-[#f1f1f1]">
              {label}
            </Link>
          ))}
        </nav>
        <form action={signOutAction} className="absolute bottom-5 left-4 right-4">
          <button className="btn btn-ghost w-full text-sm">Sair</button>
        </form>
      </aside>
      <section className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b border-[#e1e3e5] bg-[#fbfbfb]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="brand-display text-2xl italic text-[var(--toffee-800)]">originally</Link>
            <form action={signOutAction}>
              <button className="btn btn-ghost text-xs">Sair</button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#303030]">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="mx-auto max-w-[1240px] px-5 py-7 lg:px-8">{children}</div>
      </section>
    </main>
  );
}
