import { authenticate } from "../shopify.server";
import { approveProposals } from "../services/proposals.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const body = await readRequestBody(request);
    const result = await approveProposals({
      shop: session.shop,
      proposalIds: body.proposalIds,
    });
    return Response.json({ result });
  } catch (error) {
    return jsonError(error);
  }
}
