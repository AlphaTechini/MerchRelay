# Persistence

Prisma PostgreSQL stores Shopify sessions and the MerchRelay collaboration history.

Architectural decision: proposal revisions, merchant decisions, executions, activity entries, and hashed external-agent pairing credentials are durable records scoped by shop. Raw Global Catalog responses and plaintext pairing secrets are not persisted.

To find persistence models visit [schema.prisma](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/schema.prisma).

To find the MVP migration visit [migration.sql](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/migrations/20260901000000_merchrelay_mvp/migration.sql).

To find the initial agent-pairing migration visit [migration.sql](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/migrations/20260902140000_agent_pairings/migration.sql).

To find the long-lived judge pairing and proposal attribution migration visit [migration.sql](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/migrations/20260903120000_judge_pairings/migration.sql).

The PostgreSQL connection can be found in [schema.prisma](file:///C:/Hackathons/Shopify%20Agent/web-mcp-merchant-research-lab/prisma/schema.prisma).
