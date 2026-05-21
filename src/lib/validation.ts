import { z } from "zod";
import { slugify } from "./format";

export const variantSchema = z.object({
  size: z.string().trim().min(1, "Informe o tamanho"),
  color: z.string().trim().min(1, "Informe a cor"),
  stock: z.coerce.number().int().min(0),
  price_cents: z.coerce.number().int().min(0).nullable().optional(),
  active: z.boolean().default(true),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2, "Informe o nome"),
  slug: z.string().trim().optional(),
  short_description: z.string().trim().nullable().optional(),
  description: z.string().trim().min(10, "Informe uma descricao maior"),
  price_cents: z.coerce.number().int().min(1, "Informe o preco"),
  whatsapp_message: z.string().trim().nullable().optional(),
  badge: z.string().trim().nullable().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
  variants: z.array(variantSchema).default([]),
});

export function normalizeProductInput(input: unknown) {
  const parsed = productSchema.parse(input);
  return {
    ...parsed,
    slug: parsed.slug ? slugify(parsed.slug) : slugify(parsed.name),
  };
}

export function assertImageLimit(current: number, incoming: number, limit = 12) {
  if (current + incoming > limit) {
    throw new Error(`Cada produto pode ter no maximo ${limit} imagens.`);
  }
}
