import { requirePairedAgent } from "../services/agent-pairing.server";
import { runCatalogResearch } from "../services/research.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function action({ request }) {
  try {
    const { shop } = await requirePairedAgent(request);
    const body = await readRequestBody(request);
    const result = await runCatalogResearch({
      shop,
      query: body.query,
      filters: body.filters,
      like: body.like,
      limit: body.limit,
      actor: "paired_agent",
      tool: "research_product_category",
    });
    return Response.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
