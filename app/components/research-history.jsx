import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Badge } from "./workspace-page";
import CatalogResult from "./catalog-result";

/* eslint-disable react/prop-types */

function resultCount(run) {
  return typeof run.resultMeta?.count === "number"
    ? run.resultMeta.count
    : "Unknown";
}

export default function ResearchHistory({ runs }) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const products = fetcher.data?.products || [];

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.researchRunId) {
      revalidator.revalidate();
    }
  }, [fetcher.data, fetcher.state, revalidator]);

  const rerun = (query) =>
    fetcher.submit(
      { query },
      {
        method: "post",
        action: "/api/research",
        encType: "application/json",
      },
    );

  if (runs.length === 0) {
    return (
      <div className="workspace-empty">
        No research runs have been recorded for this store yet.
      </div>
    );
  }

  return (
    <div className="workspace-stack">
      <p className="workspace-muted">
        Runs retain metadata only. Re-run a query to retrieve current public
        catalog evidence without storing product results.
      </p>
      <ul className="workspace-list">
        {runs.map((run) => (
          <li className="workspace-list-item" key={run.id}>
            <div>
              <strong>{run.query}</strong>
              <span>
                {new Date(run.startedAt).toLocaleString()} - {resultCount(run)}{" "}
                results
              </span>
              {run.session?.proposals?.length > 0 && (
                <span>
                  Session proposals:{" "}
                  {run.session.proposals
                    .map((proposal) => proposal.title)
                    .join(", ")}
                </span>
              )}
            </div>
            <button
              className="workspace-button secondary"
              type="button"
              disabled={fetcher.state !== "idle"}
              onClick={() => rerun(run.query)}
            >
              {fetcher.state === "submitting" ? "Re-running..." : "Re-run"}
            </button>
          </li>
        ))}
      </ul>
      {fetcher.data?.error && (
        <p className="workspace-error">{fetcher.data.error}</p>
      )}
      {products.length > 0 && (
        <div className="workspace-stack">
          <div className="workspace-inline">
            <strong>Current catalog results</strong>
            <Badge>Not stored</Badge>
            <button
              className="workspace-button secondary"
              type="button"
              onClick={() => revalidator.revalidate()}
            >
              Refresh history
            </button>
          </div>
          {products.map((product) => (
            <CatalogResult key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

/* eslint-enable react/prop-types */
