import { authenticate } from "../shopify.server";
import { createProposal } from "../services/proposals.server";
import { getOrCreateMerchantSession } from "../services/merchant-analysis.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const body = await readRequestBody(request);
    const merchantSession = await getOrCreateMerchantSession(
      session.shop,
      body.goal,
    );
    const proposal = await createProposal({
      admin,
      shop: session.shop,
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
    });

    return Response.json({ proposal });
  } catch (error) {
    return jsonError(error);
  }
}
