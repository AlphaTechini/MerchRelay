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
    const days = Math.min(
      Math.max(Number(new URL(request.url).searchParams.get("days") || 30), 1),
      60,
    );
    const analysis = await getMerchantAnalysis(admin, days);
    const merchantSession = await getOrCreateMerchantSession(
      shop,
      "Paired agent analyzed merchant context.",
    );
    await recordActivity({
      shop,
      sessionId: merchantSession.id,
      actor: "paired_agent",
      tool: "analyze_store_performance",
      type: "context_analyzed",
      summary: `Analyzed ${days} days of merchant data through agent pairing.`,
      metadata: { days },
    });
    return Response.json({ analysis });
  } catch (error) {
    return jsonError(error);
  }
}
