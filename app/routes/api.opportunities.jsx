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
    const analysis = await getMerchantAnalysis(admin, 30);
    const merchantSession = await getOrCreateMerchantSession(
      session.shop,
      "Identify evidence-backed store opportunities.",
    );
    await recordActivity({
      shop: session.shop,
      sessionId: merchantSession.id,
      actor: "agent",
      tool: "identify_store_opportunities",
      type: "opportunities_identified",
      summary: `Identified ${analysis.opportunities.length} candidates.`,
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
