# Routes

The `routes` directory contains authenticated merchant pages, authenticated same-origin API routes, Shopify authentication routes, and Shopify webhook handlers.

Architectural decision: merchant pages and agent tools share the same authenticated server routes. This keeps Shopify access tokens server-side while showing every agent-created proposal, merchant decision, execution, and verification result in the workspace.

To find the authenticated workspace shell and mounted WebMCP tools visit [app.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app.jsx).

To find the merchant overview and verified analytics visit [app._index.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app._index.jsx).

To find merchant-selected Global Catalog research visit [app.research.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app.research.jsx).

To find proposal creation and safe draft-product targets visit [app.opportunities.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app.opportunities.jsx).

To find batch approval and individual proposal review visit [app.proposals.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app.proposals.jsx).

To find the agent collaboration view visit [app.agent.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app.agent.jsx).

To find merchant-managed external agent pairing visit [app.pairings.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/app.pairings.jsx).

To find the one-time external agent connection entry visit [agent.connect.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/agent.connect.jsx).

To find paired-agent scoped API routes visit [agent-api.context.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/agent-api.context.jsx).

To find the public UCP platform profile visit [ucp-profile.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/ucp-profile.jsx).

To find the approved execution and automatic verification connection visit [api.proposals.$id.execute.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/routes/api.proposals.$id.execute.jsx).

The Shopify authentication connection can be found in [shopify.server.js](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/shopify.server.js).
