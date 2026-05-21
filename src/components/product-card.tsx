import Link from "next/link";
import { ArrowRight, MessageCircle, PawPrint } from "lucide-react";
import type { Product, SiteSettings } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export function ProductCard({ product, settings, compact = false }: { product: Product; settings: SiteSettings; compact?: boolean }) {
  const image = product.images[0];
  const message = buildProductMessage({ product, settings });
  const inStock = product.variants.length === 0 || product.variants.some((variant) => variant.active && variant.stock > 0);

  return (
    <article className="group overflow-hidden rounded-[22px] border border-[rgba(84,53,24,0.08)] bg-white shadow-[0_16px_38px_rgba(80,40,30,0.08)]">
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[1.08/1] overflow-hidden product-art">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-[rgba(84,53,24,0.28)]">
              <PawPrint size={74} />
            </div>
          )}
          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-[var(--mint)] px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--toffee-800)]">
              {product.badge}
            </span>
          ) : null}
          {!inStock ? (
            <span className="absolute right-4 top-4 rounded-full bg-[var(--ink-900)] px-3 py-1 text-xs font-black text-white">
              Esgotado
            </span>
          ) : null}
        </div>
      </Link>
      <div className={compact ? "p-4" : "p-5"}>
        <div className="mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--mint-ink)]">
          {product.category?.name || "Originally"}
        </div>
        <Link href={`/produto/${product.slug}`}>
          <h3 className="text-[clamp(1rem,2vw,1.25rem)] font-semibold leading-[1.3] text-[var(--toffee-800)]">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-[1.65] text-[var(--ink-500)]">{product.short_description || product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <strong className="text-base font-bold text-[var(--ink-900)]">{formatPrice(product.price_cents)}</strong>
          <Link href={`/produto/${product.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold tracking-[0.03em] text-[var(--toffee-800)]">
            Detalhes <ArrowRight size={14} />
          </Link>
        </div>
        <a
          href={buildWhatsAppUrl(settings.whatsapp_number, message)}
          target="_blank"
          rel="noreferrer"
          className="btn btn-mint mt-5 w-full text-sm"
        >
          <MessageCircle size={17} /> WhatsApp
        </a>
      </div>
    </article>
  );
}
