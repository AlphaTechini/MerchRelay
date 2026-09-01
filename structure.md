# Project Structure

```text
app/
  components/       Browser WebMCP registration.
  routes/           Shopify pages, API handlers, auth, and webhooks.
  services/         Admin GraphQL, merchant analysis, catalog, and proposal logic.
  db.server.js      Prisma client connection.
prisma/
  schema.prisma     Shopify session and MerchRelay persistence models.
  migrations/       PostgreSQL schema migrations.
shopify.app.toml    Shopify app identity, scopes, webhooks, and app URL.
vercel.json         Vercel build and migration command.
```

To find WebMCP tool registration visit [webmcp-tools.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/webmcp-tools.jsx).

To find merchant context and performance analysis visit [merchant-analysis.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/merchant-analysis.server.js).

To find Shopify cost and throttle handling visit [admin-graphql.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/admin-graphql.server.js).

To find Global Catalog authentication and search visit [catalog.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/catalog.server.js).

To find proposal approval, execution, and verification visit [proposals.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/proposals.server.js).

To find persistence models visit [schema.prisma](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/schema.prisma).

The Shopify Admin connection can be found in [shopify.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/shopify.server.js).

The PostgreSQL connection can be found in [schema.prisma](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/schema.prisma).

The Vercel deployment connection can be found in [vercel.json](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/vercel.json).
