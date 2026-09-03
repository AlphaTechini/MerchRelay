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
  if (rating === null || rating === undefined) return null;
  if (typeof rating === "number") return `${rating} rating`;
  if (typeof rating !== "object") return null;
  const value = rating.value ?? rating.average ?? rating.rating;
  const count = rating.count ?? rating.review_count ?? rating.reviewCount;
  if (value === undefined) return null;
  return count === undefined
    ? `${value} rating`
    : `${value} rating from ${count} reviews`;
}

function formatAvailability(availability) {
  if (availability === null || availability === undefined) return null;
  if (typeof availability === "string") return availability;
  if (typeof availability !== "object") return null;
  if (typeof availability.status === "string") {
    return availability.status.replaceAll("_", " ");
  }
  if (typeof availability.available === "boolean") {
    return availability.available ? "Available" : "Unavailable";
  }
  const entries = Object.entries(availability)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`,
    );
  return entries.length > 0 ? entries.join(", ") : null;
}

function descriptionText(product) {
  const description =
    product.description ||
    product.descriptionHtml ||
    product.description_html ||
    product.body_html ||
    product.bodyHtml;
  const html =
    typeof description === "string"
      ? description
      : description?.html || description?.plain || "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    filters: filters || { availableOnly: true },
    like,
    limit: Number(limit || 10),
  });
  const merchantSession = await getOrCreateMerchantSession(
    shop,
    normalizedQuery,
  );
  const products = (result.products || []).slice(0, 20).map((product) => {
    const rawSeller =
      product.seller ||
      product.merchant ||
      product.vendor ||
      product.brand ||
      product.variants?.[0]?.seller ||
      null;
    const seller =
      typeof rawSeller === "string" ? { name: rawSeller } : rawSeller;
    const availability =
      product.availability || product.variants?.[0]?.availability || null;
    const image =
      product.media?.find((item) => item.type === "image") ||
      product.images?.[0] ||
      product.image ||
      null;
    const imageUrl =
      typeof image === "string"
        ? image
        : image?.url ||
          image?.src ||
          image?.image?.url ||
          product.image_url ||
          product.imageUrl ||
          null;
    return {
      id: product.id,
      title: product.title,
      priceRange: product.price_range,
      priceDisplay: formatPriceRange(product.price_range),
      rating: product.rating,
      ratingDisplay: formatRating(product.rating),
      seller,
      url: product.url || product.product_url || product.link,
      availability,
      availabilityDisplay: formatAvailability(availability),
      descriptionText: descriptionText(product),
      imageUrl,
      imageAlt: image?.alt_text || image?.alt || product.title,
    };
  });
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
