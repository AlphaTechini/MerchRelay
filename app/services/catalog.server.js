const DEFAULT_AGENT_PROFILE =
  "https://shopify.dev/ucp/agent-profiles/2026-04-08/valid-with-capabilities.json";

function catalogConfiguration() {
  const endpoint = process.env.CATALOG_ENDPOINT?.trim();

  if (!endpoint) {
    throw new Error(
      "Global Catalog requires CATALOG_ENDPOINT in the server environment.",
    );
  }

  return { endpoint };
}

export async function searchGlobalCatalog({
  query,
  filters = {},
  like,
  limit = 10,
}) {
  const { endpoint } = catalogConfiguration();
  const catalog = {
    query,
    filters,
    pagination: { limit: Math.min(Math.max(limit, 1), 50) },
  };

  if (like) catalog.like = [like];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      id: Date.now(),
      params: {
        name: "search_catalog",
        arguments: {
          meta: { "ucp-agent": { profile: DEFAULT_AGENT_PROFILE } },
          catalog,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Global Catalog search failed.");
  }

  const payload = await response.json();
  if (payload.error) {
    throw new Error("Global Catalog returned an error.");
  }

  return payload.result?.structuredContent || { products: [], messages: [] };
}
