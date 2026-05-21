"use client";

import { useMemo, useState } from "react";
import type { ProductVariant } from "@/lib/types";

type VariantDraft = Pick<ProductVariant, "size" | "color" | "stock" | "price_cents" | "active">;

export function VariantEditor({ variants }: { variants: ProductVariant[] }) {
  const [items, setItems] = useState<VariantDraft[]>(
    variants.length ? variants.map(({ size, color, stock, price_cents, active }) => ({ size, color, stock, price_cents, active })) : [],
  );
  const value = useMemo(() => JSON.stringify(items), [items]);

  return (
    <section className="shopify-card">
      <input type="hidden" name="variants" value={value} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--mint-ink)]">Variações</span>
          <h2 className="brand-display text-3xl text-[var(--toffee-800)]">Tamanho, cor e estoque</h2>
        </div>
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => setItems((current) => [...current, { size: "", color: "", stock: 0, price_cents: null, active: true }])}
        >
          Adicionar
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded-2xl bg-[var(--blush-50)] p-4 md:grid-cols-[1fr_1fr_0.8fr_0.8fr_auto]">
            <input className="admin-input" placeholder="Tamanho" value={item.size} onChange={(event) => update(index, { size: event.target.value })} />
            <input className="admin-input" placeholder="Cor" value={item.color} onChange={(event) => update(index, { color: event.target.value })} />
            <input className="admin-input" placeholder="Estoque" type="number" value={item.stock} onChange={(event) => update(index, { stock: Number(event.target.value) })} />
            <input
              className="admin-input"
              placeholder="Preço opcional em centavos"
              type="number"
              value={item.price_cents ?? ""}
              onChange={(event) => update(index, { price_cents: event.target.value ? Number(event.target.value) : null })}
            />
            <button type="button" className="btn bg-white text-sm" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
              Remover
            </button>
          </div>
        ))}
        {!items.length ? <p className="text-sm text-[var(--ink-500)]">Sem variações. O botão WhatsApp usa apenas o produto.</p> : null}
      </div>
    </section>
  );

  function update(index: number, patch: Partial<VariantDraft>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }
}
