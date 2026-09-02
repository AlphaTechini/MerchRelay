const version = "2026-04-08";

const profile = {
  ucp: {
    version,
    services: {
      "dev.ucp.shopping": [
        {
          version,
          spec: "https://ucp.dev/2026-04-08/specification/overview",
          transport: "mcp",
          schema:
            "https://ucp.dev/2026-04-08/services/shopping/mcp.openrpc.json",
        },
      ],
    },
    capabilities: {
      "dev.ucp.shopping.catalog.search": [
        {
          version,
          spec: "https://ucp.dev/2026-04-08/specification/catalog/search",
          schema:
            "https://ucp.dev/2026-04-08/schemas/shopping/catalog_search.json",
        },
      ],
      "dev.ucp.shopping.catalog.lookup": [
        {
          version,
          spec: "https://ucp.dev/2026-04-08/specification/catalog/lookup",
          schema:
            "https://ucp.dev/2026-04-08/schemas/shopping/catalog_lookup.json",
        },
      ],
      "dev.shopify.catalog.global": [
        {
          version,
          spec: "https://shopify.dev/docs/agents/catalog/global-catalog",
          schema:
            "https://shopify.dev/ucp/schemas/2026-04-08/shopify_catalog_global.json",
          extends: [
            "dev.ucp.shopping.catalog.lookup",
            "dev.ucp.shopping.catalog.search",
          ],
        },
      ],
    },
    payment_handlers: {},
  },
};

export function loader() {
  return Response.json(profile, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
