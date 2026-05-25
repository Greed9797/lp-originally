import { describe, expect, it } from "vitest";
import { summarizeContactEvents, type ContactMetricEvent } from "../contacts";

const events: ContactMetricEvent[] = [
  { id: "1", product_id: "p1", product_name: "Cama Basic", placement: "product", source_path: "/produto/cama", created_at: "2026-05-25T10:00:00.000Z" },
  { id: "2", product_id: "p1", product_name: "Cama Basic", placement: "home", source_path: "/", created_at: "2026-05-25T11:00:00.000Z" },
  { id: "3", product_id: "p2", product_name: "Bolsa", placement: "floating", source_path: "/", created_at: "2026-05-20T11:00:00.000Z" },
];

describe("contact metrics helpers", () => {
  it("summarizes total, recent clicks, placement and product rankings", () => {
    const summary = summarizeContactEvents(events, new Date("2026-05-25T12:00:00.000Z"));

    expect(summary.total).toBe(3);
    expect(summary.last7Days).toBe(3);
    expect(summary.last30Days).toBe(3);
    expect(summary.last24Hours).toBe(2);
    expect(summary.byPlacement).toEqual([
      { placement: "product", count: 1 },
      { placement: "home", count: 1 },
      { placement: "floating", count: 1 },
    ]);
    expect(summary.byProduct[0]).toEqual({ productId: "p1", productName: "Cama Basic", count: 2 });
  });
});
