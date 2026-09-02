import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Badge } from "./workspace-page";

/* eslint-disable react/prop-types */

function pairingStatus(pairing) {
  if (pairing.revokedAt) return "revoked";
  if (new Date(pairing.expiresAt) <= new Date()) return "expired";
  return pairing.claimedAt ? "active" : "waiting";
}

export default function AgentPairingPanel({ pairings }) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.refreshed) {
      revalidator.revalidate();
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  const createPairing = () =>
    fetcher.submit(
      { intent: "create" },
      { method: "post", encType: "application/json" },
    );

  const revokePairing = (pairingId) =>
    fetcher.submit(
      { intent: "revoke", pairingId },
      { method: "post", encType: "application/json" },
    );

  return (
    <div className="workspace-stack">
      <div className="workspace-callout">
        <strong>External agent pairing</strong>
        <span>
          A pairing link is single-use, lasts eight hours, and never exposes a
          Shopify access token. The paired agent can read, research, create
          proposals, and apply only a revision you already approved.
        </span>
      </div>
      <button
        className="workspace-button"
        type="button"
        disabled={fetcher.state !== "idle"}
        onClick={createPairing}
      >
        {fetcher.state === "submitting"
          ? "Creating pairing..."
          : "Create pairing link"}
      </button>
      {fetcher.data?.pairingUrl && (
        <label>
          Copy this one-time link into the external agent browser
          <input
            className="workspace-input"
            readOnly
            value={fetcher.data.pairingUrl}
          />
        </label>
      )}
      {fetcher.data?.error && (
        <p className="workspace-error">{fetcher.data.error}</p>
      )}
      <ul className="workspace-list">
        {pairings.map((pairing) => {
          const status = pairingStatus(pairing);
          return (
            <li className="workspace-list-item" key={pairing.id}>
              <div>
                <strong>
                  Created {new Date(pairing.createdAt).toLocaleString()}
                </strong>
                <span>
                  Expires {new Date(pairing.expiresAt).toLocaleString()}
                </span>
                {pairing.lastUsedAt && (
                  <span>
                    Last used {new Date(pairing.lastUsedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="workspace-inline">
                <Badge tone={status === "active" ? "success" : ""}>
                  {status}
                </Badge>
                {status === "active" || status === "waiting" ? (
                  <button
                    className="workspace-button secondary"
                    type="button"
                    disabled={fetcher.state !== "idle"}
                    onClick={() => revokePairing(pairing.id)}
                  >
                    Revoke
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* eslint-enable react/prop-types */
