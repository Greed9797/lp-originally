"use client";

import { useState } from "react";
import { MessageCircle, PawPrint } from "lucide-react";
import type { Product, ProductVariant, SiteSettings } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export function ProductDetailClient({ product, settings }: { product: Product; settings: SiteSettings }) {
  const activeVariants = product.variants.filter((variant) => variant.active);
  const [selectedId, setSelectedId] = useState(activeVariants.find((variant) => variant.stock > 0)?.id ?? activeVariants[0]?.id ?? "");
  const selected = activeVariants.find((variant) => variant.id === selectedId) ?? null;
  const price = selected?.price_cents ?? product.price_cents;
  const canBuy = activeVariants.length === 0 || Boolean(selected && selected.stock > 0);
  const message = buildProductMessage({ product, variant: selected, settings });

  return (
    <div className="container-shell grid gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
      <div className="grid gap-4">
        <div className="relative aspect-square overflow-hidden rounded-[28px] product-art shadow-[0_22px_58px_rgba(80,40,30,0.13)]">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[rgba(84,53,24,0.24)]">
              <PawPrint size={120} />
            </div>
          )}
        </div>
        {product.images.length > 1 ? (
          <div className="grid grid-cols-4 gap-3">
            {product.images.slice(1, 5).map((image) => (
              <div key={image.id} className="aspect-square overflow-hidden rounded-2xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-[0_16px_42px_rgba(80,40,30,0.08)] lg:p-8">
        <div className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--mint-ink)]">{product.category?.name || "Originally"}</div>
        <h1 className="brand-display mt-3 text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-[-0.02em] text-[var(--toffee-800)]">{product.name}</h1>
        <p className="mt-5 text-[clamp(0.875rem,1.5vw,1rem)] leading-[1.65] text-[var(--ink-500)]">{product.short_description}</p>
        <div className="mt-6 text-base font-bold text-[var(--ink-900)]">{formatPrice(price)}</div>

        {activeVariants.length ? (
          <div className="mt-8">
            <div className="mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--ink-500)]">Escolha tamanho e cor</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {activeVariants.map((variant) => (
                <VariantButton
                  key={variant.id}
                  variant={variant}
                  selected={variant.id === selectedId}
                  onSelect={() => setSelectedId(variant.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <a
          href={canBuy ? buildWhatsAppUrl(settings.whatsapp_number, message) : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!canBuy}
          className={`btn mt-8 w-full ${canBuy ? "btn-mint" : "pointer-events-none bg-zinc-200 text-zinc-500"}`}
        >
          <MessageCircle size={18} />
          {canBuy ? settings.whatsapp_button_label : "Variacao esgotada"}
        </a>

        <div className="mt-8 border-t border-[var(--blush-200)] pt-6">
          <h2 className="brand-display text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] tracking-[-0.01em] text-[var(--toffee-800)]">Descricao</h2>
          <p className="mt-3 whitespace-pre-line text-[var(--ink-700)]">{product.description}</p>
        </div>
      </section>
    </div>
  );
}

function VariantButton({ variant, selected, onSelect }: { variant: ProductVariant; selected: boolean; onSelect: () => void }) {
  const soldOut = variant.stock <= 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition ${
        selected ? "border-[var(--mint-ink)] bg-[rgba(54,215,183,0.13)]" : "border-[var(--blush-200)] bg-white"
      } ${soldOut ? "opacity-50" : ""}`}
    >
      <strong className="block text-[var(--ink-900)]">{variant.size} / {variant.color}</strong>
      <span className="text-sm text-[var(--ink-500)]">{soldOut ? "Esgotado" : `${variant.stock} em estoque`}</span>
      {variant.price_cents ? <span className="block text-sm font-bold text-[var(--toffee-800)]">{formatPrice(variant.price_cents)}</span> : null}
    </button>
  );
}
