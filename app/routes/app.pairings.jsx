import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import AgentPairingPanel from "../components/agent-pairing-panel";
import { Card, WorkspacePage } from "../components/workspace-page";
import {
  createAgentPairing,
  listAgentPairings,
  revokeAgentPairing,
} from "../services/agent-pairing.server";
import { recordActivity } from "../services/merchant-analysis.server";
import { jsonError, readRequestBody } from "../services/route-response.server";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return { pairings: await listAgentPairings(session.shop) };
}

export async function action({ request }) {
  try {
    const { session } = await authenticate.admin(request);
    const body = await readRequestBody(request);

    if (body.intent === "create") {
      const { pairing, pairingUrl } = await createAgentPairing(session.shop);
      await recordActivity({
        shop: session.shop,
        actor: "merchant",
        tool: "agent_pairing",
        type: "agent_pairing_created",
        summary: "Created an eight-hour, one-time agent pairing link.",
        metadata: { pairingId: pairing.id, expiresAt: pairing.expiresAt },
      });
      return Response.json({
        pairingUrl,
        pairingType: "one_time",
        refreshed: true,
      });
    }

    if (body.intent === "create_long_lived") {
      const { pairing, pairingUrl } = await createAgentPairing(session.shop, {
        longLived: true,
      });
      await recordActivity({
        shop: session.shop,
        actor: "merchant",
        tool: "agent_pairing",
        type: "long_lived_agent_pairing_created",
        summary:
          "Created a reusable agent pairing link that remains active until revoked.",
        metadata: { pairingId: pairing.id },
      });
      return Response.json({
        pairingUrl,
        pairingType: "long_lived",
        refreshed: true,
      });
    }

    if (body.intent === "revoke") {
      await revokeAgentPairing({
        shop: session.shop,
        pairingId: body.pairingId,
      });
      await recordActivity({
        shop: session.shop,
        actor: "merchant",
        tool: "agent_pairing",
        type: "agent_pairing_revoked",
        summary: "Revoked an external agent pairing.",
        metadata: { pairingId: body.pairingId },
      });
      return Response.json({ refreshed: true });
    }

    throw new Error("Unsupported agent pairing action.");
  } catch (error) {
    return jsonError(error);
  }
}

export default function PairingsPage() {
  const { pairings } = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="External agent access"
      title="Agent pairing"
      description="Pair an external browser agent without sharing your Shopify passkey or access token. You can revoke access at any time."
    >
      <Card title="Pairing sessions" detail={`${pairings.length} recent`}>
        <AgentPairingPanel pairings={pairings} />
      </Card>
    </WorkspacePage>
  );
}
