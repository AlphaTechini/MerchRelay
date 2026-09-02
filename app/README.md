# App Module

The app module contains the React Router application, Shopify server configuration, browser WebMCP registration, authenticated routes, API handlers, and domain services.

Architectural decision: Shopify authentication and Admin API access remain server-side. Browser tools call same-origin authenticated routes and never receive Shopify access tokens or Global Catalog credentials.

To find authenticated Shopify setup visit [shopify.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/shopify.server.js).

To find the merchant-facing workspace visit [app._index.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app._index.jsx).

To find authenticated pages and API handlers visit [ROUTES.md](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/ROUTES.md).

To find browser components visit [components/README.md](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/README.md).

The Shopify session connection can be found in [db.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/db.server.js).
