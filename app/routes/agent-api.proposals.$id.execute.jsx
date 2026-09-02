import { requirePairedAgent } from "../services/agent-pairing.server";
import {
  executeApprovedProposal,
  verifyProposalExecution,
} from "../services/proposals.server";
import { jsonError } from "../services/route-response.server";

export async function action({ request, params }) {
  try {
    const { admin, shop } = await requirePairedAgent(request);
    const execution = await executeApprovedProposal({
      admin,
      shop,
      proposalId: params.id,
      actor: "paired_agent",
      tool: "apply_merchant_approved_changes",
    });
    const verification = await verifyProposalExecution({
      admin,
      shop,
      proposalId: params.id,
      actor: "paired_agent",
      tool: "verify_applied_changes",
    });
    return Response.json({ execution, verification });
  } catch (error) {
    return jsonError(error);
  }
}

export async function loader({ request, params }) {
  try {
    const { admin, shop } = await requirePairedAgent(request);
    const verification = await verifyProposalExecution({
      admin,
      shop,
      proposalId: params.id,
      actor: "paired_agent",
      tool: "verify_applied_changes",
    });
    return Response.json(verification);
  } catch (error) {
    return jsonError(error);
  }
}
