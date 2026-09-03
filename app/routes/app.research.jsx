import { useLoaderData } from "react-router";
import ResearchConsole from "../components/research-console";
import ResearchHistory from "../components/research-history";
import { Card, WorkspacePage } from "../components/workspace-page";
import { authenticate } from "../shopify.server";
import { getMerchantAnalysis } from "../services/merchant-analysis.server";
import prisma from "../db.server";

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const [analysis, runs] = await Promise.all([
    getMerchantAnalysis(admin, 30),
    prisma.researchRun.findMany({
      where: { shop: session.shop },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        session: {
          select: {
            proposals: {
              select: { id: true, title: true, status: true },
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
      },
    }),
  ]);
  return { recommendedResearch: analysis.recommendedResearch, runs };
}

export default function ResearchPage() {
  const { recommendedResearch, runs } = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="External evidence"
      title="Research"
      description="Search public Shopify catalog data, compare comparable products, and carry selected evidence into a merchant proposal."
    >
      <Card title="Category research" detail="Global Catalog">
        <ResearchConsole
          initialQuery={recommendedResearch.query}
          researchContext={recommendedResearch}
        />
      </Card>
      <Card title="Research guardrails">
        <div className="workspace-callout">
          Catalog results are public external evidence. They are not treated as
          competitor performance data and are never applied automatically.
        </div>
      </Card>
      <Card title="Research history" detail={`${runs.length} saved runs`}>
        <ResearchHistory runs={runs} />
      </Card>
    </WorkspacePage>
  );
}
