import type { Category, HomeSlot, Product, SiteSettings } from "./types";

export const sampleCategories: Category[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Roupas", slug: "roupas", description: "Casacos, macacoes e pecas para passeio.", sort_order: 1 },
  { id: "22222222-2222-4222-8222-222222222222", name: "Camas", slug: "camas", description: "Camas e ninhos premium.", sort_order: 2 },
  { id: "33333333-3333-4333-8333-333333333333", name: "Acessorios", slug: "acessorios", description: "Coleiras, bolsas e detalhes.", sort_order: 3 },
];

export const sampleProducts: Product[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    category_id: sampleCategories[0].id,
    category: sampleCategories[0],
    name: "Jaqueta Corta Vento Sherpa",
    slug: "jaqueta-corta-vento-sherpa",
    short_description: "Protecao leve, toque macio e acabamento premium para passeios frios.",
    description: "Jaqueta corta vento com forro sherpa, ajuste confortavel e abertura para guia. Ideal para caes pequenos e medios nos dias de vento.",
    price_cents: 18990,
    whatsapp_message: "Ola! Quero a Jaqueta Corta Vento Sherpa da Originally.",
    badge: "Top vendas",
    status: "published",
    featured: true,
    images: [],
    variants: [
      { id: "v1", product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", size: "P", color: "Toffee", stock: 8, price_cents: null, active: true },
      { id: "v2", product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", size: "M", color: "Toffee", stock: 5, price_cents: 19990, active: true },
    ],
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    category_id: sampleCategories[1].id,
    category: sampleCategories[1],
    name: "Cama Ortopedica Luxo",
    slug: "cama-ortopedica-luxo",
    short_description: "Base firme, capa lavavel e descanso com cara de decoracao.",
    description: "Cama ortopedica com espuma de suporte, capa removivel e costura reforcada. Pensada para pets que precisam de conforto diario.",
    price_cents: 24990,
    whatsapp_message: "Ola! Quero a Cama Ortopedica Luxo da Originally.",
    badge: "Novidade",
    status: "published",
    featured: true,
    images: [],
    variants: [
      { id: "v3", product_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", size: "Unico", color: "Blush", stock: 4, price_cents: null, active: true },
    ],
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    category_id: sampleCategories[0].id,
    category: sampleCategories[0],
    name: "Macacao Soft Comfort",
    slug: "macacao-soft-comfort",
    short_description: "Macacao macio para dormir, viajar e posar para fotos.",
    description: "Macacao em tecido soft com modelagem confortavel, elastico suave e acabamento sem atrito para o pet se movimentar bem.",
    price_cents: 12990,
    whatsapp_message: "Ola! Quero o Macacao Soft Comfort da Originally.",
    badge: null,
    status: "published",
    featured: false,
    images: [],
    variants: [
      { id: "v4", product_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", size: "P", color: "Cocoa", stock: 0, price_cents: null, active: true },
      { id: "v5", product_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", size: "M", color: "Cocoa", stock: 6, price_cents: null, active: true },
    ],
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    category_id: sampleCategories[2].id,
    category: sampleCategories[2],
    name: "Bolsa Pet de Passeio",
    slug: "bolsa-pet-passeio",
    short_description: "Bolsa estruturada para saidas rapidas e viagens curtas.",
    description: "Bolsa pet com alca confortavel, ventilacao lateral e base acolchoada. Indicada para pets pequenos que acompanham a rotina.",
    price_cents: 14990,
    whatsapp_message: "Ola! Quero a Bolsa Pet de Passeio da Originally.",
    badge: "Lancamento",
    status: "published",
    featured: true,
    images: [],
    variants: [
      { id: "v6", product_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", size: "Unico", color: "Menta", stock: 3, price_cents: null, active: true },
    ],
  },
];

export const sampleSettings: SiteSettings = {
  whatsapp_number: "5511999999999",
  whatsapp_default_message: "Ola! Tenho interesse em produtos da Originally.",
  whatsapp_button_label: "Comprar pelo WhatsApp",
};

export const sampleHomeSlots: HomeSlot[] = [
  { id: "h1", position: "hero", product_id: sampleProducts[0].id, sort_order: 1, product: sampleProducts[0] },
  { id: "h2", position: "destaques", product_id: sampleProducts[0].id, sort_order: 1, product: sampleProducts[0] },
  { id: "h3", position: "destaques", product_id: sampleProducts[1].id, sort_order: 2, product: sampleProducts[1] },
  { id: "h4", position: "novidades", product_id: sampleProducts[3].id, sort_order: 1, product: sampleProducts[3] },
  { id: "h5", position: "colecao", product_id: sampleProducts[2].id, sort_order: 1, product: sampleProducts[2] },
];
