import prisma from "../db.server";
import { searchGlobalCatalog } from "./catalog.server";
import {
  getOrCreateMerchantSession,
  recordActivity,
} from "./merchant-analysis.server";

function formatCatalogMoney(money) {
  if (!money || typeof money.amount !== "number" || !money.currency)
    return null;
  const digits = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
  }).resolvedOptions().maximumFractionDigits;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency,
  }).format(money.amount / 10 ** digits);
}

function formatPriceRange(priceRange) {
  const minimum = formatCatalogMoney(priceRange?.min);
  const maximum = formatCatalogMoney(priceRange?.max);
  if (!minimum) return null;
  return maximum && maximum !== minimum ? `${minimum} to ${maximum}` : minimum;
}

function formatRating(rating) {
  if (!rating || typeof rating !== "object") return null;
  const value = rating.value ?? rating.average ?? rating.rating;
  const count = rating.count ?? rating.review_count ?? rating.reviewCount;
  if (value === undefined) return null;
  return count === undefined
    ? `${value} rating`
    : `${value} rating from ${count} reviews`;
}

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
    priceDisplay: formatPriceRange(product.price_range),
    rating: product.rating,
    ratingDisplay: formatRating(product.rating),
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
