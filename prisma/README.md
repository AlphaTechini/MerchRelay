# Persistence

Prisma PostgreSQL stores Shopify sessions and the MerchRelay collaboration history.

Architectural decision: proposal revisions, merchant decisions, executions, and activity entries are durable records scoped by shop. Raw Global Catalog responses are not persisted; only selected evidence and query metadata belong in the application database.

To find persistence models visit [schema.prisma](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/schema.prisma).

To find the MVP migration visit [migration.sql](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/migrations/20260901000000_merchrelay_mvp/migration.sql).

The PostgreSQL connection can be found in [schema.prisma](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/schema.prisma).
