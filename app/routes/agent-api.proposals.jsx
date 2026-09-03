import { requirePairedAgent } from "../services/agent-pairing.server";
import { getOrCreateMerchantSession } from "../services/merchant-analysis.server";
import { createProposal } from "../services/proposals.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request }) {
  try {
    const { admin, pairing, shop } = await requirePairedAgent(request);
    const body = await readRequestBody(request);
    const merchantSession = await getOrCreateMerchantSession(shop, body.goal);
    const proposal = await createProposal({
      admin,
      shop,
      sessionId: merchantSession.id,
      productId: body.productId,
      changes: body.changes,
      sourceProductState: body.sourceProductState,
      title: body.title,
      rationale: body.rationale,
      internalEvidence: body.internalEvidence,
      externalEvidence: body.externalEvidence,
      risk: body.risk,
      uncertainty: body.uncertainty,
      createdByPairingId: pairing.id,
      actor: "paired_agent",
      tool: "create_research_proposal",
    });
    return Response.json({ proposal });
  } catch (error) {
    return jsonError(error);
  }
}
