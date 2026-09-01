import { useState } from "react";
import { useFetcher } from "react-router";

/* eslint-disable react/prop-types */

export default function ResearchConsole({ compact = false }) {
  const fetcher = useFetcher();
  const [query, setQuery] = useState("");
  const products = fetcher.data?.products || [];

  return (
    <div className="workspace-stack">
      <p className="workspace-muted">
        Search the public Shopify catalog for comparable products. Results are
        external evidence and are not treated as merchant performance data.
      </p>
      <div className="workspace-inline">
        <input
          className="workspace-input"
          aria-label="Category research query"
          placeholder="Try: travel backpacks under 150 USD"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="workspace-button"
          type="button"
          disabled={!query.trim() || fetcher.state !== "idle"}
          onClick={() =>
            fetcher.submit(
              { query },
              {
                method: "post",
                action: "/api/research",
                encType: "application/json",
              },
            )
          }
        >
          {fetcher.state === "submitting" ? "Researching..." : "Research"}
        </button>
      </div>
      {fetcher.data?.error && (
        <p className="workspace-error">{fetcher.data.error}</p>
      )}
      {!compact &&
        products.map((product) => (
          <div className="workspace-list-item" key={product.id}>
            <div>
              <strong>{product.title}</strong>
              <span>{product.seller?.name || "Unknown seller"}</span>
            </div>
            {product.url && (
              <a href={product.url} target="_blank" rel="noreferrer">
                Open listing
              </a>
            )}
          </div>
        ))}
      {compact && products.length > 0 && (
        <p className="workspace-muted">
          {products.length} results returned. Open Research for the full
          comparison list.
        </p>
      )}
    </div>
  );
}

/* eslint-enable react/prop-types */
