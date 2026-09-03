import {
  requireJudgeApprovalToken,
  requirePairedAgent,
} from "../services/agent-pairing.server";
import {
  approvePairedAgentProposal,
  executeApprovedProposal,
  verifyProposalExecution,
} from "../services/proposals.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request, params }) {
  try {
    const { admin, pairing, shop } = await requirePairedAgent(request);
    const body = await readRequestBody(request);
    let approval = null;
    if (body.approvalToken) {
      if (pairing.expiresAt) {
        throw new Error(
          "Judge token approval is available only through a long-lived pairing link.",
        );
      }
      requireJudgeApprovalToken(body.approvalToken);
      approval = await approvePairedAgentProposal({
        shop,
        proposalId: params.id,
        pairingId: pairing.id,
      });
    }
    const execution = await executeApprovedProposal({
      admin,
      shop,
      proposalId: params.id,
      actor: "paired_agent",
      tool: "approve_and_apply_paired_proposal",
    });
    const verification = await verifyProposalExecution({
      admin,
      shop,
      proposalId: params.id,
      actor: "paired_agent",
      tool: "approve_and_apply_paired_proposal",
    });
    const changedFields = approval
      ? Object.keys(approval.revision.proposedChanges)
      : [];
    return Response.json({
      approval: approval?.proposal || null,
      execution,
      verification,
      summary: {
        productId: verification.product?.id || execution.resourceId,
        changedFields,
        message: approval
          ? verification.verified
            ? `Applied and verified ${changedFields.join(", ")} for ${verification.product.title}. Ask the user to refresh the product details to see the changes.`
            : `Applied ${changedFields.join(", ")} for the product, but Shopify verification did not complete. Ask the user to refresh the product details to confirm the changes.`
          : verification.verified
            ? `Applied and verified the merchant-approved proposal for ${verification.product.title}. Ask the user to refresh the product details to see the changes.`
            : "Applied the merchant-approved proposal, but Shopify verification did not complete. Ask the user to refresh the product details to confirm the changes.",
      },
    });
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
