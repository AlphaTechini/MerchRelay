import { authenticate } from "../shopify.server";
import {
  executeApprovedProposal,
  verifyProposalExecution,
} from "../services/proposals.server";
import { jsonError } from "../services/route-response.server";

export async function action({ request, params }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const execution = await executeApprovedProposal({
      admin,
      shop: session.shop,
      proposalId: params.id,
    });
    return Response.json({ execution });
  } catch (error) {
    return jsonError(error);
  }
}

export async function loader({ request, params }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const verification = await verifyProposalExecution({
      admin,
      shop: session.shop,
      proposalId: params.id,
    });
    return Response.json(verification);
  } catch (error) {
    return jsonError(error);
  }
}
