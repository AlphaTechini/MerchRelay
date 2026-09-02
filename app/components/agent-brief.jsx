import { Badge, Card } from "./workspace-page";

const toolGroups = [
  {
    title: "Read the merchant context",
    tools: [
      "get_merchant_context",
      "analyze_store_performance",
      "rank_products_by_category",
      "identify_store_opportunities",
    ],
  },
  {
    title: "Research and propose",
    tools: ["research_product_category", "create_research_proposal"],
  },
  {
    title: "Apply verified approval",
    tools: ["apply_merchant_approved_changes", "verify_applied_changes"],
  },
];

/* eslint-disable react/prop-types */

export default function AgentBrief({ analysis, activity }) {
  return (
    <div className="workspace-stack">
      <Card title="Recommended next tool call" detail="Verified store signal">
        <p>
          Start with <code>analyze_store_performance</code>, then research{" "}
          <strong>{analysis.recommendedResearch.category}</strong>.
        </p>
        <div className="workspace-callout">
          {analysis.recommendedResearch.reason}
        </div>
      </Card>
      <div className="workspace-grid-3">
        {toolGroups.map((group) => (
          <Card key={group.title} title={group.title}>
            <ul className="workspace-list">
              {group.tools.map((tool) => (
                <li className="workspace-list-item" key={tool}>
                  <code>{tool}</code>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card
        title="Collaboration state"
        detail={`${activity.length} recent events`}
      >
        <div className="workspace-inline">
          <Badge tone="success">Merchant approval required</Badge>
          <Badge>Shopify mutation guarded</Badge>
          <Badge>Verification recorded</Badge>
        </div>
      </Card>
    </div>
  );
}

/* eslint-enable react/prop-types */
