import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { Badge, Card, WorkspacePage } from "../components/workspace-page";
import { getMerchantAnalysis } from "../services/merchant-analysis.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  return getMerchantAnalysis(admin, 30);
}

export default function OpportunitiesPage() {
  const analysis = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="Evidence-backed next steps"
      title="Opportunities"
      description="Signals are ranked from verified Flash Store data. Nothing changes until a proposal is created and approved."
    >
      <Card
        title="Candidates"
        detail={`${analysis.opportunities.length} detected`}
      >
        {analysis.opportunities.length === 0 ? (
          <div className="workspace-empty">
            No immediate opportunities were detected.
          </div>
        ) : (
          <ul className="workspace-list">
            {analysis.opportunities.map((opportunity) => (
              <li
                className="workspace-list-item"
                key={`${opportunity.type}-${opportunity.productId}`}
              >
                <div>
                  <strong>{opportunity.title}</strong>
                  <span>{opportunity.reason}</span>
                </div>
                <Badge>{opportunity.type}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Draft products" detail="Safe first-mutation targets">
        {analysis.products.filter((product) => product.status === "DRAFT")
          .length === 0 ? (
          <div className="workspace-empty">
            No draft products are currently available.
          </div>
        ) : (
          <ul className="workspace-list">
            {analysis.products
              .filter((product) => product.status === "DRAFT")
              .map((product) => (
                <li className="workspace-list-item" key={product.id}>
                  <div>
                    <strong>{product.title}</strong>
                    <span>{product.productType || "Uncategorized"}</span>
                  </div>
                  <Badge tone="success">Draft</Badge>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </WorkspacePage>
  );
}
