import { authenticate } from "../shopify.server";
import { decideProposal } from "../services/proposals.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const body = await readRequestBody(request);
    const proposal = await decideProposal({
      shop: session.shop,
      proposalId: params.id,
      decision: body.decision,
      notes: body.notes,
    });

    return Response.json({ proposal });
  } catch (error) {
    return jsonError(error);
  }
}
