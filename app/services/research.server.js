import prisma from "../db.server";
import { searchGlobalCatalog } from "./catalog.server";
import {
  getOrCreateMerchantSession,
  recordActivity,
} from "./merchant-analysis.server";

export async function runCatalogResearch({
  shop,
  query,
  filters,
  like,
  limit,
  actor = "agent",
  tool = "research_product_category",
}) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) throw new Error("A research query is required.");

  const result = await searchGlobalCatalog({
    query: normalizedQuery,
    filters: filters || { available: true },
    like,
    limit: Number(limit || 10),
  });
  const merchantSession = await getOrCreateMerchantSession(
    shop,
    normalizedQuery,
  );
  const products = (result.products || []).slice(0, 20).map((product) => ({
    id: product.id,
    title: product.title,
    priceRange: product.price_range,
    rating: product.rating,
    seller: product.seller,
    url: product.url,
    availability: product.variants?.[0]?.availability || null,
  }));
  const researchRun = await prisma.researchRun.create({
    data: {
      shop,
      sessionId: merchantSession.id,
      source: "shopify_global_catalog",
      query: normalizedQuery,
      resultMeta: {
        count: products.length,
        totalCount: result.pagination?.total_count || null,
        cursor: result.pagination?.cursor || null,
      },
    },
  });
  await recordActivity({
    shop,
    sessionId: merchantSession.id,
    actor,
    tool,
    type: "catalog_researched",
    summary: normalizedQuery,
    metadata: { researchRunId: researchRun.id, count: products.length },
  });

  return {
    researchRunId: researchRun.id,
    query: normalizedQuery,
    products,
    messages: result.messages || [],
  };
}
