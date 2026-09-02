import { requirePairedAgent } from "../services/agent-pairing.server";
import prisma from "../db.server";
import { jsonError } from "../services/route-response.server";

export async function loader({ request }) {
  try {
    const { shop } = await requirePairedAgent(request);
    const activity = await prisma.activityEntry.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ activity });
  } catch (error) {
    return jsonError(error);
  }
}
