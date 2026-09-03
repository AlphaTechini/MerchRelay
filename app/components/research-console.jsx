import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import CatalogResult from "./catalog-result";

/* eslint-disable react/prop-types */

export default function ResearchConsole({
  compact = false,
  initialQuery = "",
  researchContext,
}) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [query, setQuery] = useState(initialQuery);
  const [currency, setCurrency] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [condition, setCondition] = useState("");
  const [limit, setLimit] = useState("10");
  const products = fetcher.data?.products || [];

  const submitResearch = () => {
    const filters = {
      ...(currency.trim() ? { currency: currency.trim().toUpperCase() } : {}),
      ...(minPrice ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
      availableOnly,
      ...(condition ? { condition } : {}),
    };

    fetcher.submit(
      { query, filters, limit: Number(limit) },
      {
        method: "post",
        action: "/api/research",
        encType: "application/json",
      },
    );
  };

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
          onClick={submitResearch}
        >
          {fetcher.state === "submitting" ? "Researching..." : "Research"}
        </button>
      </div>
      {query.trim() && (
        <div className="workspace-filter-panel">
          <div>
            <strong>Optional catalog filters</strong>
            <p className="workspace-muted">
              Narrow the public catalog search without adding filter syntax to
              the query.
            </p>
          </div>
          <div className="workspace-filter-grid">
            <label className="workspace-field">
              Currency
              <input
                className="workspace-input"
                inputMode="text"
                maxLength={3}
                placeholder="USD"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              />
            </label>
            <label className="workspace-field">
              Minimum price
              <input
                className="workspace-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </label>
            <label className="workspace-field">
              Maximum price
              <input
                className="workspace-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="150"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </label>
            <label className="workspace-field">
              Condition
              <select
                className="workspace-input"
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
              >
                <option value="">Any condition</option>
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </label>
            <label className="workspace-field">
              Results
              <input
                className="workspace-input"
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
            </label>
          </div>
          <label className="workspace-checkbox">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) => setAvailableOnly(event.target.checked)}
            />
            Only show available products
          </label>
        </div>
      )}
      {fetcher.data?.error && (
        <p className="workspace-error">{fetcher.data.error}</p>
      )}
      {!compact &&
        products.map((product) => (
          <CatalogResult key={product.id} product={product} />
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
