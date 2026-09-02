import { redirect, useLoaderData } from "react-router";
import { redeemAgentPairing } from "../services/agent-pairing.server";

export async function loader({ request }) {
  try {
    const pairingSecret = new URL(request.url).searchParams.get("pairing");
    const { cookie } = await redeemAgentPairing(pairingSecret);
    throw redirect("/agent", {
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return { error: error.message };
  }
}

export default function AgentConnectPage() {
  const { error } = useLoaderData();

  return (
    <main className="workspace-page">
      <p className="workspace-eyebrow">MerchRelay external agent</p>
      <h1>Pairing unavailable</h1>
      <div className="workspace-callout">{error}</div>
    </main>
  );
}
