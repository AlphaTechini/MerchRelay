import { useEffect } from "react";

async function callTool(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Tool request failed.");
  return JSON.stringify(payload);
}

const tools = [
  {
    name: "get_merchant_context",
    description:
      "Read the authenticated merchant store, products, inventory, locations, and recent orders.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => callTool("/api/opportunities"),
  },
  {
    name: "analyze_store_performance",
    description:
      "Analyze recent verified merchant sales, product performance, categories, and inventory alerts.",
    inputSchema: {
      type: "object",
      properties: { days: { type: "integer", minimum: 1, maximum: 60 } },
    },
    annotations: { readOnlyHint: true },
    execute: ({ days = 30 }) => callTool(`/api/context?days=${days}`),
  },
  {
    name: "identify_store_opportunities",
    description:
      "Identify evidence-backed merchant opportunities without changing Shopify data.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => callTool("/api/context?days=30"),
  },
  {
    name: "research_product_category",
    description:
      "Search the configured Shopify Global Catalog for public comparable products.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1 },
        filters: { type: "object" },
        like: { type: "object" },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: ({ query, filters, like, limit }) =>
      callTool("/api/research", {
        method: "POST",
        body: JSON.stringify({ query, filters, like, limit }),
      }),
  },
  {
    name: "create_research_proposal",
    description:
      "Create a research-backed proposal for merchant review without applying a Shopify change.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        changes: { type: "object" },
        title: { type: "string" },
        rationale: { type: "string" },
        internalEvidence: { type: "object" },
        externalEvidence: { type: "object" },
        risk: { type: "string" },
        uncertainty: { type: "string" },
      },
      required: ["productId", "changes"],
    },
    execute: (input) =>
      callTool("/api/proposals", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  {
    name: "get_session_activity",
    description:
      "Read the current merchant-supervised analysis, proposal, decision, execution, and verification history.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => callTool("/api/activity"),
  },
  {
    name: "apply_merchant_approved_changes",
    description:
      "Apply only the exact proposal revision that the merchant approved in the UI.",
    inputSchema: {
      type: "object",
      properties: { proposalId: { type: "string" } },
      required: ["proposalId"],
    },
    annotations: { readOnlyHint: false },
    execute: ({ proposalId }) =>
      callTool(`/api/proposals/${encodeURIComponent(proposalId)}/execute`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
  },
  {
    name: "verify_applied_changes",
    description:
      "Re-read Shopify and verify the recorded approved change matches the current resource state.",
    inputSchema: {
      type: "object",
      properties: { proposalId: { type: "string" } },
      required: ["proposalId"],
    },
    annotations: { readOnlyHint: true },
    execute: ({ proposalId }) =>
      callTool(`/api/proposals/${encodeURIComponent(proposalId)}/execute`),
  },
];

export default function WebMcpTools() {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return undefined;

    const controller = new AbortController();
    for (const tool of tools) {
      modelContext.registerTool(tool, { signal: controller.signal });
    }

    return () => controller.abort();
  }, []);

  return null;
}
