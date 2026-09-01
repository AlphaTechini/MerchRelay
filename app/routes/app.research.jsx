import ResearchConsole from "../components/research-console";
import { Card, WorkspacePage } from "../components/workspace-page";

export default function ResearchPage() {
  return (
    <WorkspacePage
      eyebrow="External evidence"
      title="Research"
      description="Search public Shopify catalog data, compare comparable products, and carry selected evidence into a merchant proposal."
    >
      <Card title="Category research" detail="Global Catalog">
        <ResearchConsole />
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
