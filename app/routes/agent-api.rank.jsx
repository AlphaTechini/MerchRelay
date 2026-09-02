import { requirePairedAgent } from "../services/agent-pairing.server";
import {
  getMerchantAnalysis,
  getOrCreateMerchantSession,
  recordActivity,
} from "../services/merchant-analysis.server";
import { jsonError } from "../services/route-response.server";

export async function loader({ request }) {
  try {
    const { admin, shop } = await requirePairedAgent(request);
    const category = new URL(request.url).searchParams
      .get("category")
      ?.trim()
      .toLowerCase();
    const analysis = await getMerchantAnalysis(admin, 30);
    const products = category
      ? analysis.rankedProducts.filter(
          (product) => product.category.toLowerCase() === category,
        )
      : analysis.rankedProducts.slice(0, 10);
    const merchantSession = await getOrCreateMerchantSession(
      shop,
      "Paired agent ranked products.",
    );
    await recordActivity({
      shop,
      sessionId: merchantSession.id,
      actor: "paired_agent",
      tool: "rank_products_by_category",
      type: "products_ranked",
      summary: category
        ? `Ranked ${category} through agent pairing.`
        : "Ranked top products through agent pairing.",
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
