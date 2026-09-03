# MerchRelay

MerchRelay is a Shopify merchant-intelligence workspace built for the WebMCP Challenge. It connects a merchant and a browser-based agent around the same verified store context: the merchant sees the evidence and controls access, while the agent can analyze, research, explain, propose, and verify work through discoverable WebMCP tools.

## Why WebMCP Fits

WebMCP fits this use case because the agent can work inside the authenticated merchant workspace instead of receiving a private Shopify access token or relying on an opaque integration. The browser exposes structured, typed actions with explicit read-only or mutation annotations. This gives the agent a useful operating loop while keeping the merchant in control:

1. Read verified Shopify context, including products, inventory, locations, collections, order signals, and ShopifyQL results.
2. Research comparable public products through Shopify Global Catalog as clearly labeled external evidence.
3. Create a proposal containing the current product state, exact proposed changes, reasoning, supporting evidence, risk, and uncertainty.
4. Apply only an exact current revision through an approval path.
5. Re-read Shopify and report whether the resulting state was verified.

## Human And Agent Workflow

Merchants authenticate the Shopify app, inspect the dashboard, choose a research direction, and review proposal details in the workspace. Agents discover the same browser tools and can perform the investigation without being granted the merchant's Shopify credentials.

- A standard paired agent can read store context, research, create proposals, and apply revisions the merchant approved in the workspace.
- A long-lived judge pairing can be reused by judges until the merchant revokes it. It can also approve and apply only proposals created through that exact pairing after the judge supplies the server-only approval token.
- Every supported mutation is restricted to the allowed product fields, checked against the exact source state, verified immediately before execution, and checked again after Shopify responds.
- After a successful update, the agent receives a summary and is instructed to ask the user to refresh the product details. A new-product creation flow is not part of this MVP.

## Current Capabilities

- Shopify product, inventory, location, collection, order, and ShopifyQL context.
- Evidence-backed store opportunity detection.
- Category ranking with an honest fallback when the store has no sales history.
- Global Catalog research with query, currency, price range, availability, condition, and result-limit filters.
- Current catalog result details with seller, description, image, price, rating, availability, and listing link where supplied by the catalog response.
- Research history that stores query metadata and supports explicit re-runs without persisting raw catalog results.
- Proposal creation for title, description HTML, tags, and constrained status transitions.
- Merchant review, revision, cancellation, batch approval, execution, and post-execution verification.
- One-time eight-hour pairing links and reusable long-lived judge pairing links.
- Activity history for research, proposals, pairing events, decisions, executions, and verification.

Project structure and logic links are documented in [structure.md](structure.md).

Manual acceptance steps for the current MVP are documented in [TESTING.md](TESTING.md).

The application uses Shopify's official [React Router app template](https://shopify.dev/docs/api/shopify-app-react-router), PostgreSQL-backed Prisma storage, Shopify Admin GraphQL, Shopify Global Catalog MCP, and browser WebMCP tools.

## Quick start

### Prerequisites

Before you begin, install Node.js 20.19+ or 22.12+, pnpm, the [Shopify CLI](https://shopify.dev/docs/apps/tools/cli/getting-started), and access to a PostgreSQL database for deployment.

### Setup

```powershell
pnpm install
pnpm run setup
```

Create local configuration from `.env.example`. Keep `.env` server-side and never commit it. The required deployment values are Shopify app credentials, `SHOPIFY_APP_URL`, `SCOPES`, `DB_PRISMA_DATABASE_URL`, `CATALOG_ENDPOINT`, and `JUDGE_AGENT_APPROVAL_TOKEN`.

### Local Development

```powershell
shopify app dev
```

Press P to open the app URL. Install the app in the configured development store, then open the MerchRelay workspace.

Local development is powered by [the Shopify CLI](https://shopify.dev/docs/apps/tools/cli). It logs into your account, connects to an app, provides environment variables, updates remote config, creates a tunnel and provides commands to generate extensions.

### Validation

Run the project checks before opening a pull request or deploying:

```powershell
pnpm run lint
pnpm run typecheck
pnpm run build
```

## Configuration

| Variable                                 | Purpose                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` | Shopify app credentials.                                                                |
| `SHOPIFY_APP_URL`                        | Public app URL used for redirects and pairing links.                                    |
| `SHOPIFY_SHOP`                           | The approved development or test store.                                                 |
| `SCOPES`                                 | Shopify permissions required by the app.                                                |
| `DB_PRISMA_DATABASE_URL`                 | PostgreSQL connection used for sessions and collaboration records.                      |
| `CATALOG_ENDPOINT`                       | Shopify Global Catalog UCP MCP endpoint.                                                |
| `JUDGE_AGENT_APPROVAL_TOKEN`             | Server-only token for long-lived judge agents to approve and apply their own proposals. |

The `.env.example` file documents the configuration shape with placeholders. Never expose the Shopify credentials, database URL, or judge approval token in browser code, pairing URLs, activity records, screenshots, or agent responses.

## Deployment

### Application Storage

MerchRelay uses [Prisma](https://www.prisma.io/) with PostgreSQL for Shopify sessions and collaboration history. The schema is defined in `prisma/schema.prisma`, and Vercel runs `prisma migrate deploy` before each production build.

The production database variable is `DB_PRISMA_DATABASE_URL`. The repository never requires a local `.env` file.

### Build

Using pnpm:

```shell
pnpm run build
```

## Hosting

The production target is Vercel. Set the server-only Shopify variables, `DB_PRISMA_DATABASE_URL`, `CATALOG_ENDPOINT`, and `JUDGE_AGENT_APPROVAL_TOKEN` in the Vercel project settings. Pushes to `main` trigger the Vercel build defined in `vercel.json`.

`JUDGE_AGENT_APPROVAL_TOKEN` is a long random secret shared privately with judges. It is checked only on the server when a long-lived paired agent approves and applies a proposal it created. Do not expose it in the pairing URL, browser UI, activity log, or agent summary.

Global Catalog uses the UCP endpoint `https://catalog.shopify.com/api/ucp/mcp` and the server-side agent profile defined in `app/services/catalog.server.js`. No Catalog-specific API key or token exchange is used. A saved catalog identifier can be added to requests later.

## Deployment And Demo Flow

1. Configure the Vercel environment variables, including a strong `JUDGE_AGENT_APPROVAL_TOKEN`.
2. Deploy `main`. The configured build runs `pnpm run setup` before `pnpm run build`, applying pending Prisma migrations.
3. Open the Shopify Admin app and use `Pair agent` to create either an eight-hour link or a reusable long-lived judge link.
4. Share a pairing link only through the intended private judging channel. Treat it as a bearer credential until it is revoked.
5. In the paired agent workspace, demonstrate context analysis, public catalog research, proposal creation, and activity history.
6. For a long-lived judge flow, provide the approval token only when the agent asks for authorization to apply its own proposal. The token is submitted to the server and is not displayed back.
7. After the response confirms execution and verification, refresh the product details in Shopify to see the updated state.

The public UCP profile is served at `/.well-known/ucp`. Catalog results are external evidence and are not stored as raw product snapshots. Research history stores the query metadata and supports explicit re-runs.

## MVP Boundaries

- Product mutations cover title, description HTML, tags, and constrained status transitions only.
- Listing changes are restricted to draft products, except status-only transitions for existing products.
- Product creation, pricing, inventory, variants, collections, publishing, payments, and bulk execution are outside this MVP.
- The app does not infer conversion metrics when the store has no verified conversion query or order evidence.
- Long-lived judge access is revocable, but anyone holding its link can use the paired read and proposal tools until revocation.

See [Shopify deployment documentation](https://shopify.dev/docs/apps/launch/deployment) for platform requirements.

## Gotchas / Troubleshooting

### Database tables don't exist

If you get an error like:

```
The table `main.Session` does not exist in the current database.
```

Create the database for Prisma by running `pnpm run setup` with the protected database variable available.

### Navigating/redirecting breaks an embedded app

Embedded apps must maintain the user session, which can be tricky inside an iFrame. To avoid issues:

1. Use `Link` from `react-router` or `@shopify/polaris`. Do not use `<a>`.
2. Use `redirect` returned from `authenticate.admin`. Do not use `redirect` from `react-router`
3. Use `useSubmit` from `react-router`.

This only applies if your app is embedded, which it will be by default.

### Webhooks: shop-specific webhook subscriptions aren't updated

If you are registering webhooks in the `afterAuth` hook, using `shopify.registerWebhooks`, you may find that your subscriptions aren't being updated.

Instead of using the `afterAuth` hook declare app-specific webhooks in the `shopify.app.toml` file. This approach is easier since Shopify will automatically sync changes every time you run `deploy` (for example, `pnpm run deploy`). Please read these guides to understand more:

1. [app-specific vs shop-specific webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-subscriptions)
2. [Create a subscription tutorial](https://shopify.dev/docs/apps/build/webhooks/subscribe/get-started?deliveryMethod=https)

If you do need shop-specific webhooks, keep in mind that the package calls `afterAuth` in 2 scenarios:

- After installing the app
- When an access token expires

During normal development, the app won't need to re-authenticate most of the time, so shop-specific subscriptions aren't updated. To force your app to update the subscriptions, uninstall and reinstall the app. Revisiting the app will call the `afterAuth` hook.

### Webhooks: Admin created webhook failing HMAC validation

Webhooks subscriptions created in the [Shopify admin](https://help.shopify.com/en/manual/orders/notifications/webhooks) will fail HMAC validation. This is because the webhook payload is not signed with your app's secret key.

The recommended solution is to use [app-specific webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-subscriptions) defined in your toml file instead. Test your webhooks by triggering events manually in the Shopify admin(e.g. Updating the product title to trigger a `PRODUCTS_UPDATE`).

### Webhooks: Admin object undefined on webhook events triggered by the CLI

When you trigger a webhook event using the Shopify CLI, the `admin` object will be `undefined`. This is because the CLI triggers an event with a valid, but non-existent, shop. The `admin` object is only available when the webhook is triggered by a shop that has installed the app. This is expected.

Webhooks triggered by the CLI are intended for initial experimentation testing of your webhook configuration. For more information on how to test your webhooks, see the [Shopify CLI documentation](https://shopify.dev/docs/apps/tools/cli/commands#webhook-trigger).

### Incorrect GraphQL Hints

By default the [graphql.vscode-graphql](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql) extension for will assume that GraphQL queries or mutations are for the [Shopify Admin API](https://shopify.dev/docs/api/admin). This is a sensible default, but it may not be true if:

1. You use another Shopify API such as the storefront API.
2. You use a third party GraphQL API.

If so, please update [.graphqlrc.ts](https://github.com/Shopify/shopify-app-template-react-router/blob/main/.graphqlrc.ts).

### Using Defer & await for streaming responses

By default the CLI uses a cloudflare tunnel. Unfortunately cloudflare tunnels wait for the Response stream to finish, then sends one chunk. This will not affect production.

To test [streaming using await](https://reactrouter.com/api/components/Await#await) during local development we recommend [localhost based development](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options#localhost-based-development).

### "nbf" claim timestamp check failed

This is because a JWT token is expired. If you are consistently getting this error, it could be that the clock on your machine is not in sync with the server. To fix this ensure you have enabled "Set time and date automatically" in the "Date and Time" settings on your computer.

### Using MongoDB and Prisma

If you choose to use MongoDB with Prisma, there are some gotchas in Prisma's MongoDB support to be aware of. Please see the [Prisma SessionStorage README](https://www.npmjs.com/package/@shopify/shopify-app-session-storage-prisma#mongodb).

### Unable to require(`C:\...\query_engine-windows.dll.node`).

Unable to require(`C:\...\query_engine-windows.dll.node`).
The Prisma engines do not seem to be compatible with your system.

query_engine-windows.dll.node is not a valid Win32 application.

**Fix:** Set the environment variable:

```shell
PRISMA_CLIENT_ENGINE_TYPE=binary
```

This forces Prisma to use the binary engine mode, which runs the query engine as a separate process and can work via emulation on Windows ARM64.

## Resources

React Router:

- [React Router docs](https://reactrouter.com/home)

Shopify:

- [Intro to Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [Shopify App React Router docs](https://shopify.dev/docs/api/shopify-app-react-router)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Shopify App Bridge](https://shopify.dev/docs/api/app-bridge-library).
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components).
- [App extensions](https://shopify.dev/docs/apps/app-extensions/list)
- [Shopify Functions](https://shopify.dev/docs/api/functions)

Internationalization:

- [Internationalizing your app](https://shopify.dev/docs/apps/best-practices/internationalization/getting-started)
