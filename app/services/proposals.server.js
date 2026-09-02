import prisma from "../db.server";
import { executeAdminGraphql } from "./admin-graphql.server";
import { recordActivity } from "./merchant-analysis.server";

const PRODUCT_QUERY = `#graphql
  query ProposalProduct($id: ID!) {
    product(id: $id) {
      id
      title
      descriptionHtml
      tags
      status
      vendor
      productType
    }
  }
`;

const PRODUCT_UPDATE_MUTATION = `#graphql
  mutation ApplyApprovedProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product { id title descriptionHtml tags status }
      userErrors { field message }
    }
  }
`;

const allowedChangeFields = new Set(["title", "descriptionHtml", "tags"]);

function normalizeChanges(changes) {
  const normalized = {};
  for (const [key, value] of Object.entries(changes || {})) {
    if (!allowedChangeFields.has(key)) continue;
    if (key === "tags") {
      if (
        !Array.isArray(value) ||
        value.some((tag) => typeof tag !== "string")
      ) {
        throw new Error("tags must be an array of strings.");
      }
      normalized.tags = value.slice(0, 250);
      continue;
    }
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${key} must be a non-empty string.`);
    }
    normalized[key] = value.trim();
  }

  if (Object.keys(normalized).length === 0) {
    throw new Error(
      "A proposal must include a title, descriptionHtml, or tags change.",
    );
  }

  return normalized;
}

async function getProduct(admin, productId) {
  const result = await executeAdminGraphql(admin, PRODUCT_QUERY, {
    id: productId,
  });
  if (!result.data.product)
    throw new Error("The requested Shopify product was not found.");
  return result.data.product;
}

function productState(product) {
  return {
    id: product.id,
    title: product.title,
    descriptionHtml: product.descriptionHtml,
    tags: product.tags,
    status: product.status,
  };
}

export async function createProposal({
  admin,
  shop,
  sessionId,
  productId,
  changes,
  title,
  rationale,
  internalEvidence,
  externalEvidence,
  risk,
  uncertainty,
}) {
  const product = await getProduct(admin, productId);
  if (product.status !== "DRAFT") {
    throw new Error(
      "Only draft products can receive the initial MerchRelay proposal.",
    );
  }

  const proposedChanges = normalizeChanges(changes);
  const proposal = await prisma.proposal.create({
    data: {
      shop,
      sessionId,
      type: "listing_update",
      title: title || `Improve ${product.title}`,
      rationale:
        rationale || "Proposed from merchant context and product research.",
      internalEvidence: internalEvidence || { product: productState(product) },
      externalEvidence: externalEvidence || undefined,
      affectedProductId: product.id,
      risk:
        risk || "The change affects one draft product and is not published.",
      uncertainty: uncertainty || "Recommendation requires merchant review.",
      revisions: {
        create: {
          revision: 1,
          beforeState: productState(product),
          proposedChanges,
        },
      },
    },
    include: { revisions: true },
  });

  await recordActivity({
    shop,
    sessionId,
    proposalId: proposal.id,
    actor: "agent",
    tool: "create_research_proposal",
    type: "proposal_created",
    summary: proposal.title,
    metadata: { revision: 1, productId: product.id },
  });

  return proposal;
}

export async function decideProposal({ shop, proposalId, decision, notes }) {
  if (!["approved", "rejected"].includes(decision)) {
    throw new Error("Decision must be approved or rejected.");
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, shop },
    include: {
      revisions: { orderBy: { revision: "desc" }, take: 1 },
    },
  });
  if (!proposal) throw new Error("Proposal not found for this shop.");
  if (proposal.status !== "pending") {
    throw new Error("Only pending proposals can be approved or rejected.");
  }

  const revision = proposal.revisions[0];
  const updated = await prisma.$transaction(async (transaction) => {
    const decisionRecord = await transaction.proposalDecision.create({
      data: {
        proposalId,
        revisionId: revision.id,
        decision,
        notes: notes || undefined,
      },
    });
    const changedProposal = await transaction.proposal.update({
      where: { id: proposalId },
      data: {
        status: decision,
      },
    });
    return { changedProposal, decisionRecord };
  });

  await recordActivity({
    shop,
    proposalId,
    actor: "merchant",
    tool: "merchant_review",
    type: `proposal_${decision}`,
    summary: `${decision} revision ${revision.revision}`,
    metadata: { revision: revision.revision, notes: notes || null },
  });

  return updated.changedProposal;
}

export async function approveProposals({ shop, proposalIds }) {
  const uniqueIds = [...new Set(proposalIds || [])].slice(0, 20);
  if (uniqueIds.length === 0) {
    throw new Error("Select at least one pending proposal to approve.");
  }

  const proposals = await prisma.proposal.findMany({
    where: { id: { in: uniqueIds }, shop },
    include: { revisions: { orderBy: { revision: "desc" }, take: 1 } },
  });
  if (proposals.length !== uniqueIds.length) {
    throw new Error(
      "One or more selected proposals do not belong to this shop.",
    );
  }
  if (proposals.some((proposal) => proposal.status !== "pending")) {
    throw new Error("Only pending proposals can be batch approved.");
  }

  await prisma.$transaction(async (transaction) => {
    for (const proposal of proposals) {
      await transaction.proposalDecision.create({
        data: {
          proposalId: proposal.id,
          revisionId: proposal.revisions[0].id,
          decision: "approved",
        },
      });
      await transaction.proposal.update({
        where: { id: proposal.id },
        data: { status: "approved" },
      });
    }
  });

  await Promise.all(
    proposals.map((proposal) =>
      recordActivity({
        shop,
        proposalId: proposal.id,
        actor: "merchant",
        tool: "merchant_batch_review",
        type: "proposal_approved",
        summary: `Batch approved revision ${proposal.revisions[0].revision}`,
        metadata: { revision: proposal.revisions[0].revision },
      }),
    ),
  );

  return {
    count: proposals.length,
    proposalIds: proposals.map((proposal) => proposal.id),
  };
}

export async function cancelApprovedProposal({ shop, proposalId }) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, shop },
    include: { executions: { take: 1 } },
  });
  if (!proposal) throw new Error("Proposal not found for this shop.");
  if (proposal.status !== "approved") {
    throw new Error("Only approved proposals can be cancelled.");
  }
  if (proposal.executions.length > 0) {
    throw new Error("A proposal cannot be cancelled after execution begins.");
  }

  const cancelled = await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: "cancelled" },
  });
  await recordActivity({
    shop,
    proposalId,
    actor: "merchant",
    tool: "merchant_review",
    type: "proposal_cancelled",
    summary: "Cancelled before Shopify execution.",
    metadata: null,
  });

  return cancelled;
}

export async function reviseProposal({ admin, shop, proposalId, changes }) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, shop },
    include: { revisions: { orderBy: { revision: "desc" }, take: 1 } },
  });
  if (!proposal) throw new Error("Proposal not found for this shop.");
  if (proposal.status !== "pending") {
    throw new Error("Only pending proposals can be edited.");
  }

  const product = await getProduct(admin, proposal.affectedProductId);
  const revision = proposal.revisions[0];
  const nextChanges = normalizeChanges(changes);
  const nextRevision = revision.revision + 1;
  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.proposal.update({
      where: { id: proposalId },
      data: { currentRevision: nextRevision },
    });
    return transaction.proposalRevision.create({
      data: {
        proposalId,
        revision: nextRevision,
        beforeState: productState(product),
        proposedChanges: nextChanges,
      },
    });
  });

  await recordActivity({
    shop,
    proposalId,
    actor: "merchant",
    tool: "merchant_review",
    type: "proposal_revised",
    summary: `Edited proposal revision ${nextRevision}`,
    metadata: { revision: nextRevision },
  });

  return updated;
}

export async function executeApprovedProposal({ admin, shop, proposalId }) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, shop },
    include: {
      revisions: { orderBy: { revision: "desc" }, take: 1 },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!proposal) throw new Error("Proposal not found for this shop.");

  const revision = proposal.revisions[0];
  const decision = proposal.decisions[0];
  if (
    proposal.status !== "approved" ||
    !decision ||
    decision.decision !== "approved" ||
    decision.revisionId !== revision.id
  ) {
    throw new Error(
      "The current proposal revision has not been approved by the merchant.",
    );
  }

  const currentProduct = await getProduct(admin, proposal.affectedProductId);
  const expected = revision.beforeState;
  if (
    currentProduct.title !== expected.title ||
    currentProduct.descriptionHtml !== expected.descriptionHtml ||
    JSON.stringify(currentProduct.tags) !== JSON.stringify(expected.tags)
  ) {
    throw new Error(
      "The Shopify product changed after approval; the proposal must be reviewed again.",
    );
  }

  const execution = await prisma.execution.create({
    data: {
      shop,
      proposalId,
      revisionId: revision.id,
      resourceId: currentProduct.id,
      status: "running",
      beforeState: productState(currentProduct),
    },
  });

  try {
    const result = await executeAdminGraphql(admin, PRODUCT_UPDATE_MUTATION, {
      product: { id: currentProduct.id, ...revision.proposedChanges },
    });
    const payload = result.data.productUpdate;
    if (payload.userErrors?.length) {
      throw new Error(
        payload.userErrors.map((error) => error.message).join("; "),
      );
    }
    if (!payload.product)
      throw new Error("Shopify returned no updated product.");

    const completed = await prisma.$transaction(async (transaction) => {
      await transaction.proposal.update({
        where: { id: proposalId },
        data: { status: "executed" },
      });
      return transaction.execution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          afterState: productState(payload.product),
          completedAt: new Date(),
        },
      });
    });

    await recordActivity({
      shop,
      proposalId,
      actor: "agent",
      tool: "apply_merchant_approved_changes",
      type: "proposal_executed",
      summary: `Updated ${payload.product.title}`,
      metadata: { executionId: completed.id, productId: payload.product.id },
    });

    return completed;
  } catch (error) {
    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: "failed", error: error.message, completedAt: new Date() },
    });
    throw error;
  }
}

export async function verifyProposalExecution({ admin, shop, proposalId }) {
  const execution = await prisma.execution.findFirst({
    where: { shop, proposalId },
    orderBy: { startedAt: "desc" },
  });
  if (!execution?.resourceId)
    throw new Error("No execution exists for this proposal.");
  try {
    const product = await getProduct(admin, execution.resourceId);
    const expected = execution.afterState;
    const verified =
      execution.status === "completed" &&
      expected &&
      product.title === expected.title &&
      product.descriptionHtml === expected.descriptionHtml &&
      JSON.stringify(product.tags) === JSON.stringify(expected.tags);

    await recordActivity({
      shop,
      proposalId,
      actor: "agent",
      tool: "verify_applied_changes",
      type: "proposal_verified",
      summary: verified
        ? "Shopify state matches the approved result."
        : "Shopify state differs from the recorded result.",
      metadata: { executionId: execution.id, verified },
    });

    return { verified, product: productState(product), cost: null };
  } catch (error) {
    await recordActivity({
      shop,
      proposalId,
      actor: "agent",
      tool: "verify_applied_changes",
      type: "proposal_verification_failed",
      summary: "Shopify verification could not complete after execution.",
      metadata: { executionId: execution.id },
    });
    return { verified: false, error: error.message, product: null, cost: null };
  }
}
