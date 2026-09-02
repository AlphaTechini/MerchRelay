# MerchRelay Decisions

## Confirmed Constraints

- MerchRelay is installed and tested only against `flash-store-bpvvczlu.myshopify.com`.
- The deployment target is Vercel with PostgreSQL Prisma session and collaboration storage.
- Shopify access tokens and server configuration remain server-side.
- Catalog research uses Shopify Global Catalog UCP and does not persist raw catalog results.
- Product mutations require an exact merchant-approved proposal revision and Shopify state verification.

## Chosen Architecture

- Keep the public root as an authentication entry and require Shopify authentication for `/app` pages and API routes.
- Mount WebMCP tools inside the authenticated workspace so browser agents can discover the same actions shown to merchants.
- Use ShopifyQL for reporting when available and order-line-item analysis only as an explicit fallback.
- Keep challenge MVP mutations synchronous. Durable queue and retry infrastructure is deferred because it requires external QStash configuration.
- Restrict first-mutation proposals to draft products and supported listing fields: title, description HTML, and tags.

## Tradeoffs

- Batch approval is supported; batch execution is intentionally not. Each approved Shopify mutation runs and verifies separately so a partial failure cannot be presented as an all-or-nothing bulk update.
- Conversion metrics remain unavailable until an explicit ShopifyQL sessions query is added. MerchRelay does not infer conversion from sales data.
- High-impact inventory, pricing, variant, publish, archive, and collection changes are not included in the challenge MVP mutation path.
