import { authenticate } from "../shopify.server";
import {
  getMerchantAnalysis,
  getOrCreateMerchantSession,
  recordActivity,
} from "../services/merchant-analysis.server";
import { jsonError } from "../services/route-response.server";

export async function loader({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const category = url.searchParams.get("category")?.trim().toLowerCase();
    const analysis = await getMerchantAnalysis(admin, 30);
    const products = category
      ? analysis.rankedProducts.filter(
          (product) => product.category.toLowerCase() === category,
        )
      : analysis.rankedProducts.slice(0, 10);
    const merchantSession = await getOrCreateMerchantSession(
      session.shop,
      "Rank products by category.",
    );
    await recordActivity({
      shop: session.shop,
      sessionId: merchantSession.id,
      actor: "agent",
      tool: "rank_products_by_category",
      type: "products_ranked",
      summary: category
        ? `Ranked products in ${category}.`
        : "Ranked top products.",
      metadata: { category: category || null, count: products.length },
    });
    return Response.json({
      category: category || null,
      products,
      categories: analysis.topCategories,
    });
  } catch (error) {
    return jsonError(error);
  }
}
