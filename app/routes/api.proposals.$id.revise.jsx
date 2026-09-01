import { authenticate } from "../shopify.server";
import { reviseProposal } from "../services/proposals.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request, params }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const body = await readRequestBody(request);
    const revision = await reviseProposal({
      admin,
      shop: session.shop,
      proposalId: params.id,
      changes: body.changes,
    });
    return Response.json({ revision });
  } catch (error) {
    return jsonError(error);
  }
}
