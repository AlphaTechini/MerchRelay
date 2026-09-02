import { authenticate } from "../shopify.server";
import { cancelApprovedProposal } from "../services/proposals.server";
import { jsonError } from "../services/route-response.server";

export async function action({ request, params }) {
  try {
    const { session } = await authenticate.admin(request);
    const proposal = await cancelApprovedProposal({
      shop: session.shop,
      proposalId: params.id,
    });
    return Response.json({ proposal });
  } catch (error) {
    return jsonError(error);
  }
}
