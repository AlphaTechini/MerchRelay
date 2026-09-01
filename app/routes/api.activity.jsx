import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { jsonError } from "../services/route-response.server";

export async function loader({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const activity = await prisma.activityEntry.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json({ activity });
  } catch (error) {
    return jsonError(error);
  }
}
