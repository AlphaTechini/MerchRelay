# MerchRelay Testing Guide

This guide tests the current pushed MVP at `https://merch-relay.vercel.app` against the Flash Store development store. It covers the visible workspace, authenticated server routes, WebMCP tools, Global Catalog research, proposal review, safe execution, and verification.

## Safety Rules

- Use only the development store `flash-store-bpvvczlu.myshopify.com`.
- Create draft products only. Do not publish a test product.
- Do not create real orders, charge customers, activate payments, or edit unrelated products.
- Use a title with the prefix `[MerchRelay Test]` so test records are easy to identify.
- Never paste Shopify secrets, database URLs, or environment variable values into the browser console or a ticket.
- The execution test changes one draft product title. The product remains a draft.

## Prerequisites

1. Open the Flash Store in Shopify Admin.
2. Open Apps and launch `WebMCP Merchant Research Lab` from the store admin. Do not open the Vercel URL as a standalone unauthenticated page first.
3. Confirm the app loads at the deployed Vercel URL inside the Shopify Admin frame.
4. Confirm the app version includes the `read_reports` scope. If it does not, the ShopifyQL test is optional and the order-based fallback is the expected behavior.
5. In Vercel project settings, confirm `CATALOG_ENDPOINT` is configured as `https://catalog.shopify.com/api/ucp/mcp` or as the approved saved-catalog endpoint. The current integration does not use Catalog-specific client IDs, API keys, or bearer-token exchange.
6. If the app was reinstalled or its scopes changed, complete Shopify's authorization screen before testing.

## Test 1: Settings and Authentication

1. From the app navigation, open `Settings`.
2. Confirm `Shop` is `flash-store-bpvvczlu.myshopify.com`.
3. Confirm `App URL` is `https://merch-relay.vercel.app`.
4. Confirm `Database` shows `Connected`.
5. Confirm `Global Catalog` shows `Configured` when `CATALOG_ENDPOINT` exists. If it shows `Endpoint needed`, Catalog research is expected to return a configuration error until the Vercel variable is added.
6. Confirm the access-scope text includes `read_products`, `write_products`, `read_inventory`, `write_inventory`, `read_locations`, `read_orders`, and `read_reports` when the updated app version has been released.
7. Refresh the page. It should remain inside the authenticated app instead of redirecting to a login page.

Expected result: the store identity and non-secret deployment status are visible, and no secret value is rendered.

## Test 2: Overview and Merchant Analysis

1. Open `Overview`.
2. Confirm the store name, recent sales, order count, and product count appear.
3. Review `Performance signals`. If the store has no orders in the last 30 days, the empty-state message is expected. Otherwise, category totals should be based on recent order line items.
4. Review `Inventory watch`. Out-of-stock products may appear as review candidates. This section does not mutate inventory.
5. Review `Sales trend`.
6. If the card says `ShopifyQL report`, confirm rows contain day and sales values.
7. If the card says `Order-based fallback`, confirm the message says MerchRelay is not inventing conversion or traffic metrics. This is expected when `read_reports` is unavailable, protected reporting access is not approved, or Shopify returns a reporting error.
8. Click `Refresh analysis`.
9. Open `Activity` and confirm a new `context_analyzed` event appears after the refresh.

Expected result: analysis loads from the authenticated Flash Store session. Refreshing creates an activity record but does not create or update a Shopify product.

## Test 3: Research with Global Catalog

1. Open `Research`.
2. Enter `travel backpacks under 150 USD`.
3. Click `Research`.
4. Wait for the button to return from `Researching...` to `Research`.
5. Confirm results show a product title, seller, and an `Open listing` link when those fields are supplied by Global Catalog.
6. Open one listing in a new tab and confirm it is an external product page. Do not treat its sales, rating, or availability as Flash Store performance data.
7. Open `Activity` and confirm a `catalog_researched` event contains the search summary.

Expected result when Catalog is configured: public comparison products are returned and the result is stored as research metadata, not as competitor performance data.

Expected result when Catalog is not configured: the page shows a clear error containing `CATALOG_ENDPOINT`. This is a deployment configuration issue, not a Shopify store-data issue.

## Test 4: Opportunities and Draft Target

1. Open `Opportunities`.
2. Review `Candidates`. These are generated from verified merchant data and do not change Shopify.
3. Review `Draft products`.
4. Confirm at least one safe test product is listed with a `Draft` badge. If none exists, create one using the procedure below.
5. Confirm products with statuses other than `DRAFT` are not shown as safe first-mutation targets.

Create a safe draft test product:

1. In Shopify Admin, open `Products` and choose `Add product`.
2. Set the title to `[MerchRelay Test] Travel Backpack`.
3. Add a short description such as `Temporary draft product for MerchRelay approval testing.`
4. Set a product type such as `Travel Accessories`.
5. Leave the product status as `Draft`.
6. Save the product.
7. Return to MerchRelay and refresh `Opportunities`.

Expected result: the draft product appears in the safe target list. No product is published by this test.

## Test 5: Authenticated Route and WebMCP Read Tools

The merchant UI now creates, revises, approves, cancels, executes, and verifies proposals. The browser console snippets below remain useful for testing the authenticated API and WebMCP routes without exposing credentials.

Use the console in the MerchRelay frame:

1. Open browser developer tools.
2. Select the frame or execution context whose origin is `merch-relay.vercel.app`, not the parent `admin.shopify.com` context.
3. Run one snippet at a time.

Get merchant context:

```js
const context = await fetch("/api/context?days=30").then((response) =>
  response.json(),
);
console.log(context);
```

Confirm `context.analysis.shop`, `context.analysis.products`, `context.analysis.topProducts`, and `context.analysis.inventoryAlerts` exist. The `analysis.reporting` object should also exist and contain either `available: true` or `available: false`.

Analyze a shorter period:

```js
const analysis = await fetch("/api/context?days=7").then((response) =>
  response.json(),
);
console.log(analysis.analysis.totals, analysis.analysis.topProducts);
```

Expected result: the response is limited to seven days and the route clamps allowed values to the supported one-to-sixty-day range.

Identify opportunities:

```js
const opportunities = await fetch("/api/opportunities").then((response) =>
  response.json(),
);
console.log(opportunities);
```

Expected result: the response contains `sessionId` and an `opportunities` array. The request creates an `opportunities_identified` activity event but does not mutate Shopify.

Rank products:

```js
const ranking = await fetch("/api/rank").then((response) => response.json());
console.log(ranking.category, ranking.categories, ranking.products);
```

Rank a specific category after copying an exact category name from the previous response:

```js
const categoryRanking = await fetch(
  `/api/rank?category=${encodeURIComponent("Travel Accessories")}`,
).then((response) => response.json());
console.log(categoryRanking.products);
```

Expected result: products are ordered using verified order performance. An unknown category returns an empty `products` array instead of guessing.

## Test 6: Create a Proposal Safely

Use the draft product from Test 4.

1. Open `Opportunities`.
2. In `Create a merchant proposal`, select the `[MerchRelay Test]` draft product.
3. Enter `Test draft listing title proposal` as the proposal title.
4. Enter `[MerchRelay Test] Travel Backpack - Approved Title` as the proposed listing title.
5. Add a short merchant rationale and, if available, a public research note from the Research workspace.
6. Click `Create proposal`.

Expected result: a pending proposal is created and the UI directs you to `Proposals`. Confirm the card shows before-and-after values, evidence, risk, uncertainty, and `Approve proposal` and `Reject` controls.

If the response says `Only draft products can receive the initial MerchRelay proposal`, the selected product is not a draft. Stop and select the correct ID. Do not bypass this guard.

## Test 7: Review and Revise a Proposal

1. In `Proposals`, locate `Test draft listing title proposal`.
2. Click `View evidence` and confirm internal and external evidence are visible.
3. Click `Edit proposal`.
4. Change the title to `[MerchRelay Test] Travel Backpack - Approved Title v2`.
5. Click `Save revision`.
6. Confirm the card closes edit mode and displays the new proposed title.
7. Open `Activity` and confirm a `proposal_revised` event appears.

Expected result: revision is stored as a new proposal revision while the proposal remains `pending`. The product in Shopify must not change during this step.

## Test 8: Rejection Path

Use a second disposable draft product or create a second proposal for a different draft product.

1. Create a proposal using the procedure in Test 6.
2. On its proposal card, click `Reject`.
3. Confirm the card status changes to `rejected`.
4. Confirm the review buttons are no longer available.
5. Confirm the product title in Shopify is unchanged.
6. Open `Activity` and confirm a `proposal_rejected` event appears.

Expected result: rejection is durable, and a rejected proposal cannot be executed.

## Test 9: Approval, Execution, and Verification

Use the revised pending proposal from Test 7.

1. Before approval, open the matching product in Shopify Admin and record its current title.
2. Return to MerchRelay and click `Approve proposal`.
3. Confirm the proposal status changes to `approved` and the `Apply and verify` button appears.
4. Confirm an approval activity event appears.
5. Click `Apply and verify` once.
6. Wait for the execution status to appear.
7. Open the product in Shopify Admin and confirm its title changed to the exact approved title.
8. Confirm the product remains `Draft`.
9. Confirm the proposal card says `Verification: passed`.
10. Open `Activity` and confirm `proposal_executed` and `proposal_verified` events exist.

Expected result: only the approved revision is applied, the mutation updates one draft product, Shopify is re-read, and the recorded state matches the current state.

## Test 10: Safety Guards

These tests should fail safely. A failed request is the expected result.

Pending execution guard:

1. Create a new proposal and leave it pending.
2. Copy its ID.
3. Run:

```js
const pendingExecution = await fetch(
  `/api/proposals/${encodeURIComponent("PENDING_PROPOSAL_ID")}/execute`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  },
);
console.log(pendingExecution.status, await pendingExecution.json());
```

Expected result: HTTP 400 and an error stating that the current proposal revision has not been approved. Shopify must remain unchanged.

Stale-state guard:

1. Create a proposal for a draft product.
2. Approve the proposal.
3. Before executing, manually change that product title in Shopify Admin to another temporary `[MerchRelay Test]` title and save it.
4. Return to MerchRelay and click `Apply and verify`.

Expected result: execution fails with `The Shopify product changed after approval; the proposal must be reviewed again.` No approved change is applied over the newer Shopify state.

Non-draft proposal guard:

1. Select an existing non-draft product ID only if it is safe to read.
2. Send the Test 6 create request with that ID and a harmless proposed title.

Expected result: HTTP 400 and `Only draft products can receive the initial MerchRelay proposal.` No proposal is created and Shopify is unchanged.

## Test 11: WebMCP Registration

The app registers browser tools only when the browser exposes `document.modelContext.registerTool`.

1. Load `Overview` in the MerchRelay frame.
2. Use the browser or AI client WebMCP inspector if available.
3. Confirm these tools are listed:
4. `get_merchant_context`
5. `analyze_store_performance`
6. `identify_store_opportunities`
7. `rank_products_by_category`
8. `research_product_category`
9. `create_research_proposal`
10. `get_session_activity`
11. `apply_merchant_approved_changes`
12. `verify_applied_changes`
13. Invoke the read-only tools first. Do not invoke `apply_merchant_approved_changes` until Test 9 has been completed manually through the UI.

If the inspector does not exist in the browser or AI client, Tests 5 through 10 still validate the same authenticated tool routes. The absence of an inspector does not prove that the page failed to register tools; it means the client does not expose a discovery UI.

## Test 12: Store Isolation

1. Stay signed into Flash Store and note the product and activity results.
2. Do not test with another store unless the app owner explicitly adds it to the allowed test scope.
3. If another session is available, confirm it cannot read Flash Store proposals by changing only the authenticated shop context.

Expected result: proposal, activity, session, research, and execution records are scoped by the authenticated shop. A proposal ID from another shop must not be executable in Flash Store.

## Test 13: External Agent Pairing

1. In the authenticated Shopify Admin workspace, open `Pair agent`.
2. Click `Create pairing link`.
3. Copy the displayed one-time link into the external agent browser. Do not send it through an untrusted channel.
4. Confirm the agent browser redirects from `/agent/connect` to `/agent` and shows `MerchRelay agent workspace`.
5. Confirm the agent workspace states that merchant approval is required.
6. In a WebMCP-capable agent browser, confirm these tools are exposed: context, performance analysis, opportunities, ranking, research, proposal creation, activity, approved execution, and verification.
7. Confirm the agent workspace does not expose proposal approval, rejection, revision, cancellation, batch review, or pairing management.
8. Return to the merchant workspace and confirm the pairing status changes from `waiting` to `active`.
9. Click `Revoke` and refresh the agent page.
10. Confirm the agent page says a new merchant-generated pairing link is required and `/agent-api/context` returns an authentication error.

Expected result: the agent receives an eight-hour, single-use, revocable session without a Shopify passkey or Shopify access token. It can apply only exact revisions the merchant has already approved.

## Test 14: Agent Context and Description Safety

1. In the paired agent workspace, call `get_merchant_context`.
2. Confirm every returned product includes `descriptionHtml`, including an empty string when a product has no description.
3. Ask the agent to create a title-only proposal. Confirm it succeeds for a draft product.
4. Ask the agent to create a description-change proposal without supplying the matching current product state.
5. Confirm the request fails with `Proposal changes require the exact current product state from merchant context.` or a field-specific source-state error.
6. Ask the agent to use the `descriptionHtml` and product ID from the context response as `sourceProductState`, then create the description proposal again.

Expected result: the agent cannot replace a description it did not first inspect. The proposal records the live product as its before state and still requires merchant approval before execution.

## Test 16: Status Proposals and Research History

1. Call `get_merchant_context` and select a draft product.
2. Call `create_research_proposal` with `changes: { status: "ACTIVE" }` and `sourceProductState` containing the product ID and current `DRAFT` status.
3. Confirm the response is pending and the revision `beforeState.status` is `DRAFT`.
4. Approve the revision in the merchant workspace, apply it, and confirm verification reports `status: ACTIVE`.
5. Confirm an `ACTIVE` product can receive only a status-only proposal to `DRAFT` or `ARCHIVED`.
6. Confirm invalid transitions, such as `DRAFT` to `ARCHIVED`, and arbitrary change keys are rejected.
7. Open `Research` and confirm prior runs show the query, timestamp, result count, and same-session proposal titles.
8. Click `Re-run` on a saved query and confirm current products show formatted prices, ratings, availability, and listing links.
9. Refresh the page and confirm only run metadata remains, not the re-run product results.

Expected result: status changes follow the same source-state, merchant-approval, stale-state, execution, and verification controls as listing changes. Catalog products are fetched only for the current re-run and are not stored with research history.

## Test 15: UCP Profile and Catalog Prices

1. Request `https://merch-relay.vercel.app/.well-known/ucp` after deployment.
2. Confirm it returns JSON with UCP version `2026-04-08`, catalog search, catalog lookup, and Global Catalog capabilities.
3. Run a Global Catalog search.
4. Confirm each result contains `priceDisplay` alongside the raw UCP `priceRange` amount.
5. Confirm an amount such as `34999` with currency `USD` is displayed as `$349.99`.

Expected result: the profile is served as public JSON with `Content-Type: application/json` and is a valid platform-agent declaration used by MerchRelay's Catalog requests. Raw UCP price amounts remain available for machine use while the UI and agent receive an unambiguous human-readable price.

## Troubleshooting

### The app redirects to login

Launch the app from Shopify Admin, not as a standalone URL. If the app version or scopes changed, complete Shopify authorization again.

### Database shows Missing

The Vercel deployment is missing `DB_PRISMA_DATABASE_URL` or migrations have not run. Do not create a local `.env` to work around production configuration.

### Global Catalog shows Endpoint needed

Add the non-secret `CATALOG_ENDPOINT` variable in Vercel and redeploy. The current server integration does not require `CATALOG_CLIENT_ID` or `CATALOG_API_KEY`.

### Research returns no products

Try a broader query such as `running shoes`. Global Catalog availability depends on eligible public catalog data. An empty result is not evidence that Flash Store has no products.

### Sales are zero or empty

The overview samples recent orders. A development store with no orders will show empty order-based signals. ShopifyQL reporting may also require the released `read_reports` scope and protected-data approval.

### Proposal creation returns a product error

Confirm the ID came from `context.analysis.products` and that its status is exactly `DRAFT`. Do not use a product ID copied from an unrelated store.

### Execution says the product changed after approval

This is the intended stale-state guard. Recreate or revise the proposal after confirming the current Shopify product state.

## Evidence to Capture

Capture screenshots or notes for these checkpoints:

1. Settings showing the Flash Store identity, database status, Catalog status, and scopes without secrets.
2. Overview showing verified metrics and either ShopifyQL reporting or the explicit fallback.
3. Research showing a public catalog result and its seller/listing link.
4. A pending proposal showing evidence, risk, uncertainty, and the proposed change.
5. The approval transition and the resulting execution status.
6. Shopify Admin showing the exact title update while the product remains Draft.
7. Verification showing `verified: true`.
8. Activity showing context analysis, research, proposal review, execution, and verification.
9. A failed safety-guard request proving pending or stale changes are not applied.

## Current Limitations

- Proposal creation is available in Opportunities and through the authenticated WebMCP tool. The initial safe mutation path remains restricted to draft products.
- The current Global Catalog integration uses the standard UCP endpoint and agent profile. Saved catalog IDs and cursor pagination are not yet exposed in the UI.
- QStash jobs, retry queues, and unattended background execution are intentionally not enabled. Challenge MVP mutations remain merchant-supervised and synchronous.
- A merchant must authenticate once to create an external agent pairing. Shopify authentication cannot be bypassed by an agent.
- The current mutation path supports title, description HTML, and tags for one draft product.
- No automated end-to-end test suite is included; these are manual acceptance steps for the development store.
