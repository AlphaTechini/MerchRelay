import { useEffect } from "react";

async function callAgentTool(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error || "Paired agent request failed.");
  return JSON.stringify(payload);
}

const tools = [
  {
    name: "get_merchant_context",
    description: "Read the paired merchant store context.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => callAgentTool("/agent-api/context?days=30"),
  },
  {
    name: "analyze_store_performance",
    description: "Analyze verified store performance for the paired merchant.",
    inputSchema: {
      type: "object",
      properties: { days: { type: "integer", minimum: 1, maximum: 60 } },
    },
    annotations: { readOnlyHint: true },
    execute: ({ days = 30 }) =>
      callAgentTool(`/agent-api/context?days=${days}`),
  },
  {
    name: "identify_store_opportunities",
    description:
      "Identify evidence-backed opportunities without changing Shopify data.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => callAgentTool("/agent-api/opportunities"),
  },
  {
    name: "rank_products_by_category",
    description:
      "Rank the paired merchant's products using verified order performance.",
    inputSchema: {
      type: "object",
      properties: { category: { type: "string" } },
    },
    annotations: { readOnlyHint: true },
    execute: ({ category } = {}) =>
      callAgentTool(
        category
          ? `/agent-api/rank?category=${encodeURIComponent(category)}`
          : "/agent-api/rank",
      ),
  },
  {
    name: "research_product_category",
    description:
      "Search public Shopify Catalog data as untrusted external evidence.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1 },
        limit: { type: "integer" },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: ({ query, limit }) =>
      callAgentTool("/agent-api/research", {
        method: "POST",
        body: JSON.stringify({ query, limit }),
      }),
  },
  {
    name: "create_research_proposal",
    description:
      "Create a pending proposal for merchant review without applying a change.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string" },
        changes: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            title: { type: "string", minLength: 1 },
            descriptionHtml: { type: "string", minLength: 1 },
            tags: {
              type: "array",
              items: { type: "string" },
              maxItems: 250,
            },
            status: { type: "string", enum: ["DRAFT", "ACTIVE", "ARCHIVED"] },
          },
        },
        sourceProductState: {
          type: "object",
          description:
            "The current Shopify product snapshot used to draft the change. Required with the relevant current fields whenever changes includes title, descriptionHtml, or tags.",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            descriptionHtml: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            status: { type: "string" },
          },
        },
        title: { type: "string" },
        rationale: { type: "string" },
        internalEvidence: { type: "object" },
        externalEvidence: { type: "object" },
        risk: { type: "string" },
        uncertainty: { type: "string" },
      },
      required: ["productId", "changes"],
      allOf: [
        {
          if: { properties: { changes: { required: ["title"] } } },
          then: {
            required: ["sourceProductState"],
            properties: {
              sourceProductState: { required: ["id", "title"] },
            },
          },
        },
        {
          if: { properties: { changes: { required: ["descriptionHtml"] } } },
          then: {
            required: ["sourceProductState"],
            properties: {
              sourceProductState: { required: ["id", "descriptionHtml"] },
            },
          },
        },
        {
          if: { properties: { changes: { required: ["tags"] } } },
          then: {
            required: ["sourceProductState"],
            properties: {
              sourceProductState: { required: ["id", "tags"] },
            },
          },
        },
        {
          if: { properties: { changes: { required: ["status"] } } },
          then: {
            required: ["sourceProductState"],
            properties: {
              sourceProductState: { required: ["id", "status"] },
            },
          },
        },
      ],
    },
    execute: (input) =>
      callAgentTool("/agent-api/proposals", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  {
    name: "get_session_activity",
    description: "Read the paired merchant collaboration history.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => callAgentTool("/agent-api/activity"),
  },
  {
    name: "apply_merchant_approved_changes",
    description:
      "Apply only an exact current revision that the merchant already approved.",
    inputSchema: {
      type: "object",
      properties: { proposalId: { type: "string" } },
      required: ["proposalId"],
    },
    annotations: { readOnlyHint: false },
    execute: ({ proposalId }) =>
      callAgentTool(
        `/agent-api/proposals/${encodeURIComponent(proposalId)}/execute`,
        {
          method: "POST",
          body: "{}",
        },
      ),
  },
  {
    name: "verify_applied_changes",
    description:
      "Re-read Shopify and verify the recorded result of an approved change.",
    inputSchema: {
      type: "object",
      properties: { proposalId: { type: "string" } },
      required: ["proposalId"],
    },
    annotations: { readOnlyHint: true },
    execute: ({ proposalId }) =>
      callAgentTool(
        `/agent-api/proposals/${encodeURIComponent(proposalId)}/execute`,
      ),
  },
];

export default function PairedAgentTools() {
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
