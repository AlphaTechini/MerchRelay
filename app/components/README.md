# Components

This directory contains browser-side components for WebMCP registration, merchant proposal creation and review, catalog research, and collaboration state.

Architectural decision: WebMCP tools are registered imperatively when the workspace is mounted and removed with an abort signal when it unmounts. Read-only tools are annotated as read-only; external catalog results are marked untrusted.

To find WebMCP registration visit [webmcp-tools.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/webmcp-tools.jsx).

To find the merchant proposal composer visit [proposal-composer.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/proposal-composer.jsx).

To find proposal revision, approval, cancellation, execution, and verification UI visit [proposal-card.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/proposal-card.jsx).

To find batch proposal approval UI visit [proposal-queue.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/proposal-queue.jsx).

To find agent workflow guidance visit [agent-brief.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/agent-brief.jsx).

To find merchant pairing controls visit [agent-pairing-panel.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/agent-pairing-panel.jsx).

To find paired external-agent WebMCP registration visit [paired-agent-tools.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/paired-agent-tools.jsx).

To find persisted research metadata and compliant catalog re-runs visit [research-history.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/research-history.jsx).

The browser-to-server connection can be found in [webmcp-tools.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/webmcp-tools.jsx).
