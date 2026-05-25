"use client";

import { useMemo, useState } from "react";
import type { ProductVariant } from "@/lib/types";
import { centsToVariantPriceInput, variantPriceInputToCents } from "@/lib/admin/variants";

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
      <div className="admin-variant-list">
        {items.map((item, index) => (
          <div key={index} className="admin-variant-row">
            <label className="admin-field">
              <span>Tamanho</span>
              <input className="admin-input" placeholder="P, M, G..." value={item.size} onChange={(event) => update(index, { size: event.target.value })} />
            </label>
            <label className="admin-field">
              <span>Cor</span>
              <input className="admin-input" placeholder="Toffee, Sherpa..." value={item.color} onChange={(event) => update(index, { color: event.target.value })} />
            </label>
            <label className="admin-field">
              <span>Estoque</span>
              <input className="admin-input" placeholder="0" type="number" min="0" value={item.stock} onChange={(event) => update(index, { stock: Number(event.target.value) })} />
            </label>
            <label className="admin-field">
              <span>Preco opcional</span>
              <input
                className="admin-input"
                placeholder="199,90"
                inputMode="decimal"
                value={centsToVariantPriceInput(item.price_cents)}
                onChange={(event) => update(index, { price_cents: variantPriceInputToCents(event.target.value) })}
              />
            </label>
            <label className="shopify-toggle admin-variant-active">
              <input type="checkbox" checked={item.active} onChange={(event) => update(index, { active: event.target.checked })} />
              <span>
                <strong>Ativa</strong>
                <small>Aparece no produto</small>
              </span>
            </label>
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
