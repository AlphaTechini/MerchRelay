import { useLoaderData } from "react-router";
import ResearchConsole from "../components/research-console";
import { Card, WorkspacePage } from "../components/workspace-page";
import { authenticate } from "../shopify.server";
import { getMerchantAnalysis } from "../services/merchant-analysis.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  const analysis = await getMerchantAnalysis(admin, 30);
  return { recommendedResearch: analysis.recommendedResearch };
}

export default function ResearchPage() {
  const { recommendedResearch } = useLoaderData();

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
    </WorkspacePage>
  );
}
