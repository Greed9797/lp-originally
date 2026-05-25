export type ContactPlacement = "home" | "product" | "floating" | "collection" | "header" | "footer";

export type ContactMetricEvent = {
  id: string;
  product_id?: string | null;
  product_name?: string | null;
  placement: string;
  source_path?: string | null;
  created_at: string;
};

export type ContactMetricsSummary = {
  total: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  byPlacement: Array<{ placement: string; count: number }>;
  byProduct: Array<{ productId: string | null; productName: string; count: number }>;
};

export function summarizeContactEvents(events: ContactMetricEvent[], now = new Date()): ContactMetricsSummary {
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const placementCounts = new Map<string, number>();
  const productCounts = new Map<string, { productId: string | null; productName: string; count: number }>();

  let last24Hours = 0;
  let last7Days = 0;
  let last30Days = 0;

  for (const event of events) {
    const createdAt = new Date(event.created_at).getTime();
    if (createdAt >= oneDayAgo) last24Hours += 1;
    if (createdAt >= sevenDaysAgo) last7Days += 1;
    if (createdAt >= thirtyDaysAgo) last30Days += 1;

    placementCounts.set(event.placement, (placementCounts.get(event.placement) || 0) + 1);

    const key = event.product_id || "unknown";
    const current = productCounts.get(key) || {
      productId: event.product_id || null,
      productName: event.product_name || "Sem produto",
      count: 0,
    };
    current.count += 1;
    productCounts.set(key, current);
  }

  return {
    total: events.length,
    last24Hours,
    last7Days,
    last30Days,
    byPlacement: Array.from(placementCounts.entries()).map(([placement, count]) => ({ placement, count })),
    byProduct: Array.from(productCounts.values()).sort((a, b) => b.count - a.count),
  };
}
