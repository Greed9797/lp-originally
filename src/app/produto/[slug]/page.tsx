import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductBySlug, getSettings } from "@/lib/data";
import { ProductDetailClient } from "@/components/product-detail-client";
import { WhatsAppFloating } from "@/components/whatsapp-floating";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: `${product.name} | Originally`,
    description: product.short_description || product.description,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);

  return (
    <main>
      <div className="container-shell pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[var(--toffee-800)]">
          <ArrowLeft size={16} /> Voltar para a loja
        </Link>
      </div>
      <ProductDetailClient product={product} settings={settings} />
      <WhatsAppFloating settings={settings} />
    </main>
  );
}
