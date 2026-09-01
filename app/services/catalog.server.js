const TOKEN_URL = "https://api.shopify.com/auth/access_token";
const DEFAULT_AGENT_PROFILE =
  "https://shopify.dev/ucp/agent-profiles/2026-04-08/valid-with-capabilities.json";

let tokenCache;

function catalogConfiguration() {
  const clientId = process.env.CATALOG_CLIENT_ID?.trim();
  const apiKey = process.env.CATALOG_API_KEY?.trim();
  const endpoint = process.env.CATALOG_ENDPOINT?.trim();

  if (!clientId || !apiKey || !endpoint) {
    throw new Error(
      "Global Catalog requires CATALOG_CLIENT_ID, CATALOG_API_KEY, and CATALOG_ENDPOINT in the server environment.",
    );
  }

  return { clientId, apiKey, endpoint };
}

async function getAccessToken() {
  const { clientId, apiKey } = catalogConfiguration();
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.value;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: apiKey,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error("Global Catalog authentication failed.");
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("Global Catalog authentication returned no access token.");
  }

  tokenCache = {
    value: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in || 3600) * 1000,
  };
  return tokenCache.value;
}

export async function searchGlobalCatalog({
  query,
  filters = {},
  like,
  limit = 10,
}) {
  const { endpoint } = catalogConfiguration();
  const token = await getAccessToken();
  const catalog = {
    query,
    filters,
    pagination: { limit: Math.min(Math.max(limit, 1), 50) },
  };

  if (like) catalog.like = [like];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
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
