# Services

Services isolate server-side business logic from React Router handlers.

Architectural decision: Admin GraphQL requests are centralized so query cost and throttle state are handled consistently. Proposal execution verifies merchant approval and current Shopify state immediately before mutation, then records a separate verification result.

To find Admin GraphQL retry handling visit [admin-graphql.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/admin-graphql.server.js).

To find merchant analysis visit [merchant-analysis.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/merchant-analysis.server.js).

To find Global Catalog UCP access visit [catalog.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/catalog.server.js).

To find proposal lifecycle logic visit [proposals.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/proposals.server.js).

To find hashed, expiring agent pairing and external authentication visit [agent-pairing.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/agent-pairing.server.js).

To find reusable Global Catalog research persistence visit [research.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/services/research.server.js).

The database connection can be found in [db.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/db.server.js).
