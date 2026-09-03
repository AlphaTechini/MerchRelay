import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";

/* eslint-disable react/prop-types */

function catalogValue(value) {
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "string" || typeof value === "number") return value;
  return JSON.stringify(value);
}

export default function ResearchConsole({
  compact = false,
  initialQuery = "",
  researchContext,
}) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [query, setQuery] = useState(initialQuery);
  const products = fetcher.data?.products || [];

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.researchRunId) {
      revalidator.revalidate();
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  return (
    <div className="workspace-stack">
      <p className="workspace-muted">
        Search the public Shopify catalog for comparable products. Results are
        external evidence and are not treated as merchant performance data.
      </p>
      {researchContext && (
        <div className="workspace-callout">
          <strong>
            Selected merchant category: {researchContext.category}
          </strong>
          <span>{researchContext.reason}</span>
        </div>
      )}
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
              <span>
                Price:{" "}
                {product.priceDisplay || catalogValue(product.priceRange)}
              </span>
              {product.availability && (
                <span>Availability: {catalogValue(product.availability)}</span>
              )}
              {product.rating && (
                <span>
                  Rating:{" "}
                  {product.ratingDisplay || catalogValue(product.rating)}
                </span>
              )}
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
      {!compact && fetcher.data?.messages?.length > 0 && (
        <div className="workspace-callout">
          <strong>Catalog notes</strong>
          <span>{fetcher.data.messages.join(" ")}</span>
        </div>
      )}
    </div>
  );
}

/* eslint-enable react/prop-types */
