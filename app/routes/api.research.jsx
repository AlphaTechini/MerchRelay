import { authenticate } from "../shopify.server";
import { searchGlobalCatalog } from "../services/catalog.server";
import {
  getOrCreateMerchantSession,
  recordActivity,
} from "../services/merchant-analysis.server";
import { jsonError, readRequestBody } from "../services/route-response.server";
import prisma from "../db.server";

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const body = await readRequestBody(request);
    const query = String(body.query || "").trim();
    if (!query) throw new Error("A research query is required.");

    const result = await searchGlobalCatalog({
      query,
      filters: body.filters || { available: true },
      like: body.like,
      limit: Number(body.limit || 10),
    });
    const merchantSession = await getOrCreateMerchantSession(
      session.shop,
      query,
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
        shop: session.shop,
        sessionId: merchantSession.id,
        source: "shopify_global_catalog",
        query,
        resultMeta: {
          count: products.length,
          totalCount: result.pagination?.total_count || null,
          cursor: result.pagination?.cursor || null,
        },
      },
    });
    await recordActivity({
      shop: session.shop,
      sessionId: merchantSession.id,
      actor: "agent",
      tool: "research_product_category",
      type: "catalog_researched",
      summary: query,
      metadata: { researchRunId: researchRun.id, count: products.length },
    });

    return Response.json({
      researchRunId: researchRun.id,
      query,
      products,
      messages: result.messages || [],
    });
  } catch (error) {
    return jsonError(error);
  }
}
