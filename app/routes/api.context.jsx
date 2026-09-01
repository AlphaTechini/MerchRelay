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
    const days = Math.min(
      Math.max(Number(new URL(request.url).searchParams.get("days") || 30), 1),
      60,
    );
    const analysis = await getMerchantAnalysis(admin, days);
    const merchantSession = await getOrCreateMerchantSession(
      session.shop,
      "Analyze the store and identify one evidence-backed opportunity.",
    );
    await recordActivity({
      shop: session.shop,
      sessionId: merchantSession.id,
      actor: "agent",
      tool: "get_merchant_context",
      type: "context_analyzed",
      summary: `Analyzed ${days} days of merchant data.`,
      metadata: { days, cost: analysis.cost },
    });

    return Response.json({ sessionId: merchantSession.id, analysis });
  } catch (error) {
    return jsonError(error);
  }
}
