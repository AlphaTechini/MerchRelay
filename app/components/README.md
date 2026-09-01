# Components

This directory contains browser-side components that connect the user interface to WebMCP.

Architectural decision: WebMCP tools are registered imperatively when the workspace is mounted and removed with an abort signal when it unmounts. Read-only tools are annotated as read-only; external catalog results are marked untrusted.

To find WebMCP registration visit [webmcp-tools.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/webmcp-tools.jsx).

The browser-to-server connection can be found in [webmcp-tools.jsx](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/app/components/webmcp-tools.jsx).
