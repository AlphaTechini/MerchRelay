import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Badge } from "./workspace-page";

/* eslint-disable react/prop-types */

function pairingStatus(pairing) {
  if (pairing.revokedAt) return "revoked";
  if (pairing.expiresAt && new Date(pairing.expiresAt) <= new Date()) {
    return "expired";
  }
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

  const createPairing = (intent) => {
    setCopied(false);
    setCopyError("");
    fetcher.submit({ intent }, { method: "post", encType: "application/json" });
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
          One-time links last eight hours. Long-lived links remain active until
          revoked and can be reused by judges. Neither link exposes a Shopify
          access token.
        </span>
      </div>
      <div className="workspace-inline">
        <button
          className="workspace-button"
          type="button"
          disabled={fetcher.state !== "idle"}
          onClick={() => createPairing("create")}
        >
          {fetcher.state === "submitting"
            ? "Creating pairing..."
            : "Create eight-hour link"}
        </button>
        <button
          className="workspace-button secondary"
          type="button"
          disabled={fetcher.state !== "idle"}
          onClick={() => createPairing("create_long_lived")}
        >
          {fetcher.state === "submitting"
            ? "Creating pairing..."
            : "Generate long-lived link"}
        </button>
      </div>
      {fetcher.data?.pairingUrl && (
        <label>
          {fetcher.data.pairingType === "long_lived"
            ? "Copy this reusable judge link into the external agent browser"
            : "Copy this one-time link into the external agent browser"}
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
                  {pairing.expiresAt ? "Eight-hour" : "Long-lived"} link created{" "}
                  {new Date(pairing.createdAt).toLocaleString()}
                </strong>
                <span>
                  {pairing.expiresAt
                    ? `Expires ${new Date(pairing.expiresAt).toLocaleString()}`
                    : "Active until revoked"}
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
