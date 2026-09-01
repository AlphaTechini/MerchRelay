import { useEffect, useState } from "react";
import { useFetcher, useLoaderData, useRevalidator } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import WebMcpTools from "../components/webmcp-tools";
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

function ProposalCard({ proposal }) {
  const decisionFetcher = useFetcher();
  const executionFetcher = useFetcher();
  const revisionFetcher = useFetcher();
  const revalidator = useRevalidator();
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(
    revision?.proposedChanges?.title || "",
  );
  const revision = proposal.revisions[0];
  const decision = proposal.decisions[0];
  const execution = proposal.executions[0];
  const canReview = proposal.status === "pending";
  const canExecute = proposal.status === "approved";

  useEffect(() => {
    if (decisionFetcher.state === "idle" && decisionFetcher.data?.proposal) {
      revalidator.revalidate();
    }
  }, [decisionFetcher.data, decisionFetcher.state, revalidator]);

  useEffect(() => {
    if (executionFetcher.state === "idle" && executionFetcher.data?.execution) {
      revalidator.revalidate();
    }
  }, [executionFetcher.data, executionFetcher.state, revalidator]);

  useEffect(() => {
    if (revisionFetcher.state === "idle" && revisionFetcher.data?.revision) {
      setEditing(false);
      revalidator.revalidate();
    }
  }, [revisionFetcher.data, revisionFetcher.state, revalidator]);

  return (
    <s-box
      padding="base"
      borderWidth="base"
      borderRadius="base"
      background="subdued"
    >
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="base">
          <s-heading>{proposal.title}</s-heading>
          <s-badge
            tone={proposal.status === "approved" ? "success" : "neutral"}
          >
            {proposal.status}
          </s-badge>
        </s-stack>
        <s-paragraph>{proposal.rationale}</s-paragraph>
        <s-paragraph>
          <s-text emphasis="bold">Proposed changes: </s-text>
          {Object.entries(revision.proposedChanges)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
            )
            .join(" | ")}
        </s-paragraph>
        <s-paragraph>
          <s-text emphasis="bold">Risk: </s-text>
          {proposal.risk || "Not specified."}
        </s-paragraph>
        <s-paragraph>
          <s-text emphasis="bold">Internal evidence: </s-text>
          {JSON.stringify(proposal.internalEvidence)}
        </s-paragraph>
        {proposal.externalEvidence && (
          <s-paragraph>
            <s-text emphasis="bold">External evidence: </s-text>
            {JSON.stringify(proposal.externalEvidence)}
          </s-paragraph>
        )}
        <s-stack direction="inline" gap="base">
          {canReview && (
            <>
              <s-button
                variant="secondary"
                onClick={() => setEditing(!editing)}
              >
                {editing ? "Cancel edit" : "Edit title proposal"}
              </s-button>
              <s-button
                onClick={() =>
                  decisionFetcher.submit(
                    { decision: "approved" },
                    {
                      method: "post",
                      action: `/api/proposals/${proposal.id}/decide`,
                      encType: "application/json",
                    },
                  )
                }
              >
                Approve proposal
              </s-button>
              <s-button
                variant="secondary"
                onClick={() =>
                  decisionFetcher.submit(
                    { decision: "rejected" },
                    {
                      method: "post",
                      action: `/api/proposals/${proposal.id}/decide`,
                      encType: "application/json",
                    },
                  )
                }
              >
                Reject
              </s-button>
            </>
          )}
          {canExecute && (
            <s-button
              onClick={() =>
                executionFetcher.submit(
                  {},
                  {
                    method: "post",
                    action: `/api/proposals/${proposal.id}/execute`,
                    encType: "application/json",
                  },
                )
              }
            >
              Apply approved change
            </s-button>
          )}
        </s-stack>
        {editing && canReview && (
          <s-stack direction="inline" gap="base">
            <s-text-field
              label="Proposed title"
              value={editedTitle}
              onChange={(event) => setEditedTitle(event.currentTarget.value)}
            ></s-text-field>
            <s-button
              onClick={() =>
                revisionFetcher.submit(
                  { changes: { title: editedTitle } },
                  {
                    method: "post",
                    action: `/api/proposals/${proposal.id}/revise`,
                    encType: "application/json",
                  },
                )
              }
            >
              Save revision
            </s-button>
          </s-stack>
        )}
        {decision && (
          <s-paragraph>Merchant decision: {decision.decision}</s-paragraph>
        )}
        {execution && <s-paragraph>Execution: {execution.status}</s-paragraph>}
      </s-stack>
    </s-box>
  );
}

/* eslint-enable react/prop-types */

function ResearchPanel() {
  const fetcher = useFetcher();
  const [query, setQuery] = useState("");
  const products = fetcher.data?.products || [];

  return (
    <s-section heading="Research workspace">
      <s-stack direction="block" gap="base">
        <s-paragraph>
          Search public Shopify product data for comparable products. Results
          are external evidence, not competitor performance data.
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-text-field
            label="Category or research question"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          ></s-text-field>
          <s-button
            onClick={() =>
              fetcher.submit(
                { query },
                {
                  method: "post",
                  action: "/api/research",
                  encType: "application/json",
                },
              )
            }
          >
            Research category
          </s-button>
        </s-stack>
        {fetcher.data?.error && (
          <s-banner tone="critical">{fetcher.data.error}</s-banner>
        )}
        {products.map((product) => (
          <s-box
            key={product.id}
            padding="base"
            borderWidth="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="small">
              <s-heading>{product.title}</s-heading>
              <s-paragraph>
                {product.seller?.name || "Unknown seller"} -{" "}
                {product.priceRange?.min?.currency || ""}{" "}
                {product.priceRange?.min?.amount || "n/a"}
              </s-paragraph>
              {product.url && (
                <s-link href={product.url} target="_blank">
                  View public listing
                </s-link>
              )}
            </s-stack>
          </s-box>
        ))}
      </s-stack>
    </s-section>
  );
}

export default function Index() {
  const { analysis, proposals, activity } = useLoaderData();
  const revalidator = useRevalidator();

  return (
    <s-page heading="MerchRelay">
      <WebMcpTools />
      <s-button slot="primary-action" onClick={() => revalidator.revalidate()}>
        Refresh analysis
      </s-button>

      <s-section heading="Merchant overview">
        <s-grid
          gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))"
          gap="base"
        >
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>{analysis.shop.name}</s-heading>
            <s-paragraph>{analysis.shop.myshopifyDomain}</s-paragraph>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>
              {money(analysis.totals.sales, analysis.totals.currency)}
            </s-heading>
            <s-paragraph>Recent sales</s-paragraph>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>{analysis.totals.orders}</s-heading>
            <s-paragraph>Orders sampled (30 days)</s-paragraph>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading>{analysis.totals.products}</s-heading>
            <s-paragraph>Products reviewed</s-paragraph>
          </s-box>
        </s-grid>
      </s-section>

      <s-section heading="Performance signals">
        <s-stack direction="block" gap="base">
          <s-heading>Top categories</s-heading>
          {analysis.topCategories.length === 0 ? (
            <s-paragraph>
              No order history was available for this period.
            </s-paragraph>
          ) : (
            analysis.topCategories.map((category) => (
              <s-paragraph key={category.name}>
                <s-text emphasis="bold">{category.name}</s-text>:{" "}
                {money(category.sales, analysis.totals.currency)} across{" "}
                {category.products} products
              </s-paragraph>
            ))
          )}
          <s-heading>Top products</s-heading>
          {analysis.topProducts.map((product) => (
            <s-paragraph key={product.id}>
              <s-text emphasis="bold">{product.title}</s-text>: {product.units}{" "}
              units, {money(product.sales, analysis.totals.currency)}
            </s-paragraph>
          ))}
          {analysis.inventoryAlerts.length > 0 && (
            <s-banner tone="warning" heading="Inventory alerts">
              {analysis.inventoryAlerts
                .map((product) => `${product.title} is out of stock.`)
                .join(" ")}
            </s-banner>
          )}
        </s-stack>
      </s-section>

      <s-section heading="Opportunity candidates">
        <s-stack direction="block" gap="base">
          {analysis.opportunities.length === 0 ? (
            <s-paragraph>
              No immediate listing or inventory opportunities were detected.
            </s-paragraph>
          ) : (
            analysis.opportunities.map((opportunity) => (
              <s-paragraph key={`${opportunity.type}-${opportunity.productId}`}>
                <s-text emphasis="bold">{opportunity.title}</s-text>:{" "}
                {opportunity.reason}
              </s-paragraph>
            ))
          )}
          <s-heading>Draft products available for review</s-heading>
          {analysis.products
            .filter((product) => product.status === "DRAFT")
            .map((product) => (
              <s-paragraph key={product.id}>
                <s-text emphasis="bold">{product.title}</s-text>: {product.id}
              </s-paragraph>
            ))}
        </s-stack>
      </s-section>

      <ResearchPanel />

      <s-section heading="Proposal queue">
        <s-stack direction="block" gap="base">
          {proposals.length === 0 ? (
            <s-paragraph>
              Ask the connected agent to analyze the store and create an
              evidence-backed proposal.
            </s-paragraph>
          ) : (
            proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </s-stack>
      </s-section>

      <s-section heading="Session activity" slot="aside">
        <s-stack direction="block" gap="base">
          {activity.length === 0 ? (
            <s-paragraph>No activity recorded yet.</s-paragraph>
          ) : (
            activity.map((entry) => (
              <s-paragraph key={entry.id}>
                <s-text emphasis="bold">{entry.type}</s-text>: {entry.summary}
              </s-paragraph>
            ))
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
