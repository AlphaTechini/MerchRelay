function catalogConfiguration() {
  const endpoint = process.env.CATALOG_ENDPOINT?.trim();
  const appUrl = process.env.SHOPIFY_APP_URL?.trim();

  if (!endpoint || !appUrl) {
    throw new Error(
      "Global Catalog requires CATALOG_ENDPOINT and SHOPIFY_APP_URL in the server environment.",
    );
  }

  return {
    endpoint,
    agentProfile: new URL("/.well-known/ucp", appUrl).toString(),
  };
}

export async function searchGlobalCatalog({
  query,
  filters = {},
  like,
  limit = 10,
}) {
  const { endpoint, agentProfile } = catalogConfiguration();
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
          meta: { "ucp-agent": { profile: agentProfile } },
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
