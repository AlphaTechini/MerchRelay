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
    const analysis = await getMerchantAnalysis(admin, 30);
    const merchantSession = await getOrCreateMerchantSession(
      shop,
      "Paired agent identified store opportunities.",
    );
    await recordActivity({
      shop,
      sessionId: merchantSession.id,
      actor: "paired_agent",
      tool: "identify_store_opportunities",
      type: "opportunities_identified",
      summary: `Identified ${analysis.opportunities.length} candidates through agent pairing.`,
      metadata: { opportunities: analysis.opportunities },
    });
    return Response.json({
      sessionId: merchantSession.id,
      opportunities: analysis.opportunities,
    });
  } catch (error) {
    return jsonError(error);
  }
}
