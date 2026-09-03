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
- Restrict listing changes to draft products. Supported proposal fields are title, description HTML, tags, and tightly constrained status transitions: DRAFT to ACTIVE, or ACTIVE to DRAFT or ARCHIVED.
- Merchant-created external agent pairings are single-use, expire after eight hours, are revocable, and exchange into an HttpOnly browser cookie. The token is stored only as a hash.

## Tradeoffs

- Batch approval is supported; batch execution is intentionally not. Each approved Shopify mutation runs and verifies separately so a partial failure cannot be presented as an all-or-nothing bulk update.
- Conversion metrics remain unavailable until an explicit ShopifyQL sessions query is added. MerchRelay does not infer conversion from sales data.
- High-impact inventory, pricing, variant, publish, archive, and collection changes are not included in the challenge MVP mutation path.
- A paired agent can execute only an exact merchant-approved revision. It cannot approve, reject, revise, cancel, batch-review, or create pairings.
- A proposal that changes `descriptionHtml` must include the exact current product state used to draft it. Merchant context exposes each product's `descriptionHtml` for that purpose.
- Every supported agent-proposed field requires its matching value in `sourceProductState`. MerchRelay rereads Shopify before storing the verified `beforeState` and again before execution.
