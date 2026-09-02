import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import AgentBrief from "../components/agent-brief";
import { WorkspacePage } from "../components/workspace-page";
import { getMerchantAnalysis } from "../services/merchant-analysis.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const [analysis, activity] = await Promise.all([
    getMerchantAnalysis(admin, 30),
    prisma.activityEntry.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return { analysis, activity };
}

export default function AgentPage() {
  const { analysis, activity } = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="WebMCP collaboration"
      title="Agent workspace"
      description="MerchRelay exposes structured browser tools so the agent can analyze, research, propose, apply only merchant-approved work, and verify Shopify state."
    >
      <AgentBrief analysis={analysis} activity={activity} />
    </WorkspacePage>
  );
}
