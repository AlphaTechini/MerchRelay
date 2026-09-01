import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import ProposalCard from "../components/proposal-card";
import { Card, WorkspacePage } from "../components/workspace-page";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return prisma.proposal.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      revisions: { orderBy: { revision: "desc" }, take: 1 },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
      executions: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
}

export default function ProposalsPage() {
  const proposals = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="Merchant control"
      title="Proposals"
      description="Review evidence, edit pending changes, and approve only what should move to Shopify."
    >
      <Card title="Proposal queue" detail={`${proposals.length} proposals`}>
        {proposals.length === 0 ? (
          <div className="workspace-empty">
            No proposals yet. Ask the connected agent to create one from a
            verified opportunity.
          </div>
        ) : (
          <div className="workspace-stack">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </Card>
    </WorkspacePage>
  );
}
