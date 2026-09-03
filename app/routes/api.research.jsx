import { authenticate } from "../shopify.server";
import { runCatalogResearch } from "../services/research.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const body = await readRequestBody(request);
    const result = await runCatalogResearch({
      shop: session.shop,
      query: body.query,
      filters: body.filters || { availableOnly: true },
      like: body.like,
      limit: Number(body.limit || 10),
      actor: "agent",
      tool: "research_product_category",
    });
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
