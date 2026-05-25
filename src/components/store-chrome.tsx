"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera,
  Clock3,
  CreditCard,
  Globe2,
  MessageCircle,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/lib/types";
import { buildTrackedWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppFloating } from "./whatsapp-floating";

const institutionalLinks: [string, string][] = [
  ["Atendimento", "/"],
  ["Trocas e devolucoes", "/"],
  ["Quem somos", "/"],
  ["Compra segura", "/"],
  ["Politica de privacidade", "https://www.originallypet.com.br/politica-de-privacidade"],
  ["Avaliacoes de clientes", "/#reviews"],
];

const paymentItems = ["PIX", "Boleto", "Cartoes", "WhatsApp"];

export function StoreChrome({ children, settings }: { children: ReactNode; settings: SiteSettings }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <PromoBar />
      <StoreHeader />
      {children}
      <StoreFooter settings={settings} />
      <WhatsAppFloating settings={settings} />
    </>
  );
}

function PromoBar() {
  return (
    <div className="promo-bar">
      <span>Fabrica propria em Erechim/RS desde 2002</span>
      <span className="promo-dot" />
      <span>Camas, roupas, peitorais, guias e bolsas pet</span>
    </div>
  );
}

function StoreHeader() {
  return (
    <header className="site-header">
      <div className="container-shell site-nav">
        <Link href="/" className="brand-lockup" aria-label="Originally home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/originally-logo.png" alt="Originally" />
        </Link>
        <form className="site-search" action="/#produtos" role="search">
          <Search size={18} />
          <input name="q" type="search" placeholder="Buscar camas, roupas, peitorais..." aria-label="Buscar produtos" />
          <button type="submit">Buscar</button>
        </form>
        <nav className="nav-links" aria-label="Principal">
          <Link href="/#produtos">Shop</Link>
          <Link href="/#colecao">Colecao</Link>
          <Link href="/#como-funciona">Como comprar</Link>
          <Link href="/#reviews">Depoimentos</Link>
        </nav>
        <div className="nav-actions">
          <a
            className="icon-button"
            href={buildTrackedWhatsAppUrl({ placement: "header", sourcePath: "/" })}
            target="_blank"
            rel="noreferrer"
            aria-label="Comprar pelo WhatsApp"
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}

function StoreFooter({ settings }: { settings: SiteSettings }) {
  const specialLinks: [string, string][] = [
    ["Meus pedidos", "https://www.originallypet.com.br/entrar"],
    ["Entregas", "/"],
    ["Contate-nos", buildTrackedWhatsAppUrl({ placement: "footer", sourcePath: "/" })],
    ["Catalogo B2B", "https://www.originallypet.com.br/"],
  ];
  const phoneLabel = formatWhatsAppNumber(settings.whatsapp_number);

  return (
    <footer className="trusted-footer">
      <section className="footer-benefits" aria-label="Beneficios da loja">
        <Benefit icon={<Clock3 size={34} />} title="Atendimento" text="Seg a sex das 8h-12h e das 13h-17h" />
        <Benefit icon={<PackageCheck size={34} />} title="Trocas e devolucoes" text="Garantia e suporte antes de fechar o pedido" />
        <Benefit icon={<Truck size={36} />} title="Frete" text="Envios combinados conforme regiao, volume e disponibilidade" />
        <Benefit icon={<CreditCard size={34} />} title="Pagamento" text="Condicoes confirmadas no atendimento assistido" />
      </section>

      <section className="footer-main">
        <div className="container-shell footer-columns">
          <div className="footer-brand-block">
            <Link href="/" className="brand-lockup footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/originally-logo.png" alt="Originally" />
            </Link>
            <p>Fabrica propria de produtos para caes e gatos, com sede em Erechim/RS desde 2002.</p>
            <a
              href={buildTrackedWhatsAppUrl({ placement: "footer", sourcePath: "/" })}
              target="_blank"
              rel="noreferrer"
              className="footer-phone"
            >
              <Phone size={18} />
              {phoneLabel}
            </a>
          </div>

          <FooterLinkColumn title="Institucional" links={institutionalLinks} />
          <FooterLinkColumn title="Paginas especiais" links={specialLinks} />

          <div>
            <h2 className="footer-title">Selos de seguranca</h2>
            <div className="trust-seals">
              <div className="trust-card">
                <ShieldCheck size={36} />
                <strong>Site seguro</strong>
                <span>SSL e compra assistida</span>
              </div>
              <div className="trust-card trust-card-wide">
                <Star size={28} fill="currentColor" />
                <strong>Avaliacoes verificadas</strong>
                <span>Atendimento direto com a marca</span>
              </div>
              <div className="trust-card trust-card-wide">
                <PackageCheck size={28} />
                <strong>CNPJ ativo</strong>
                <span>05.366.148/0001-68</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="footer-title">Formas de pagamento</h2>
            <div className="payment-grid">
              {paymentItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <p className="footer-note">Valores, prazos e parcelamento sao confirmados no atendimento.</p>
          </div>
        </div>
      </section>

      <section className="footer-bottom">
        <div className="container-shell footer-bottom-inner">
          <div className="footer-social" aria-label="Redes sociais">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Camera size={18} />
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
              <Globe2 size={18} />
            </a>
          </div>
          <p>
            Originally Pet | CNPJ 05.366.148/0001-68 - Rua Henrique Dias, 583 - Centro - Erechim/RS. Direitos reservados.
          </p>
        </div>
      </section>
    </footer>
  );
}

function Benefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="footer-benefit">
      {icon}
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}

function FooterLinkColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="footer-title">{title}</h2>
      <nav className="footer-link-list" aria-label={title}>
        {links.map(([label, href]) => (
          <LinkOrAnchor key={label} href={href}>
            {label}
          </LinkOrAnchor>
        ))}
      </nav>
    </div>
  );
}

function LinkOrAnchor({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return <Link href={href}>{children}</Link>;
}

function formatWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length === 13) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.startsWith("55") && digits.length === 12) {
    return `(${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return value;
}
