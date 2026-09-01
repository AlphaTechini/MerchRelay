import { useLoaderData, useRevalidator } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import ProposalCard from "../components/proposal-card";
import ResearchConsole from "../components/research-console";
import { Badge, Card, WorkspacePage } from "../components/workspace-page";
import {
  getMerchantAnalysis,
  getOrCreateMerchantSession,
} from "../services/merchant-analysis.server";

/* eslint-disable react/prop-types */

export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const analysis = await getMerchantAnalysis(admin, 30);
  const merchantSession = await getOrCreateMerchantSession(
    session.shop,
    "Analyze the store and identify one evidence-backed opportunity.",
  );
  const proposals = await prisma.proposal.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      revisions: { orderBy: { revision: "desc" }, take: 1 },
      decisions: { orderBy: { createdAt: "desc" }, take: 1 },
      executions: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
  const activity = await prisma.activityEntry.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return { analysis, proposals, activity, sessionId: merchantSession.id };
}

function money(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function Metric({ label, value, detail }) {
  return (
    <div className="workspace-stat">
      <p className="workspace-label">{label}</p>
      <p className="workspace-stat-value">{value}</p>
      <p className="workspace-stat-detail">{detail}</p>
    </div>
  );
}

/* eslint-enable react/prop-types */

export default function Index() {
  const { analysis, proposals, activity } = useLoaderData();
  const revalidator = useRevalidator();

  return (
    <WorkspacePage
      eyebrow="Merchant intelligence workspace"
      title="Overview"
      description="A calm, evidence-first view of what is happening in Flash Store and what the connected agent recommends next."
      actions={
        <>
          <Badge tone="success">Live store</Badge>
          <button
            className="workspace-button secondary"
            type="button"
            onClick={() => revalidator.revalidate()}
          >
            Refresh analysis
          </button>
        </>
      }
    >
      <div className="workspace-stat-row">
        <Metric
          label="Store"
          value={analysis.shop.name}
          detail={analysis.shop.myshopifyDomain}
        />
        <Metric
          label="Recent sales"
          value={money(analysis.totals.sales, analysis.totals.currency)}
          detail="Sampled over 30 days"
        />
        <Metric
          label="Orders"
          value={analysis.totals.orders}
          detail="Recent order sample"
        />
        <Metric
          label="Products"
          value={analysis.totals.products}
          detail="Catalog records reviewed"
        />
      </div>

      <div className="workspace-grid-2">
        <Card title="Performance signals" detail="Verified store data">
          <ul className="workspace-list">
            {analysis.topCategories.length === 0 && (
              <li className="workspace-empty">
                No order history was available for this period.
              </li>
            )}
            {analysis.topCategories.slice(0, 5).map((category) => (
              <li className="workspace-list-item" key={category.name}>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.products} products</span>
                </div>
                <strong>
                  {money(category.sales, analysis.totals.currency)}
                </strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Inventory watch" detail="Needs attention">
          {analysis.inventoryAlerts.length === 0 ? (
            <div className="workspace-empty">
              No active products are currently flagged as out of stock.
            </div>
          ) : (
            <ul className="workspace-list">
              {analysis.inventoryAlerts.map((product) => (
                <li className="workspace-list-item" key={product.id}>
                  <div>
                    <strong>{product.title}</strong>
                    <span>Inventory: {product.inventory}</span>
                  </div>
                  <Badge tone="warning">Review</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Research" detail="External evidence">
        <ResearchConsole compact />
      </Card>

      <Card
        title="Proposal queue"
        detail={`${proposals.length} recent proposals`}
      >
        {proposals.length === 0 ? (
          <div className="workspace-empty">
            Ask the connected agent to create an evidence-backed proposal.
          </div>
        ) : (
          <div className="workspace-stack">
            {proposals.slice(0, 3).map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </Card>

      <Card title="Recent activity" detail="Latest workspace events">
        {activity.length === 0 ? (
          <div className="workspace-empty">No activity recorded yet.</div>
        ) : (
          <ul className="workspace-list">
            {activity.slice(0, 6).map((entry) => (
              <li className="workspace-list-item" key={entry.id}>
                <div>
                  <strong>{entry.type}</strong>
                  <span>{entry.summary}</span>
                </div>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </WorkspacePage>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
