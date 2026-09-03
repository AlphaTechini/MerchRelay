import { useEffect, useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.refreshed) {
      revalidator.revalidate();
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  const createPairing = () => {
    setCopied(false);
    setCopyError("");
    fetcher.submit(
      { intent: "create" },
      { method: "post", encType: "application/json" },
    );
  };

  const copyPairingLink = async () => {
    try {
      await navigator.clipboard.writeText(fetcher.data.pairingUrl);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopied(false);
      setCopyError(
        "Clipboard access was blocked. Select and copy the link manually.",
      );
    }
  };

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
          <div className="workspace-pairing-link">
            <input
              className="workspace-input"
              readOnly
              value={fetcher.data.pairingUrl}
            />
            <button
              className="workspace-button secondary workspace-copy-button"
              type="button"
              onClick={copyPairingLink}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {copyError && <span className="workspace-error">{copyError}</span>}
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
