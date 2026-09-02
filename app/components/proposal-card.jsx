import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Badge } from "./workspace-page";

/* eslint-disable react/prop-types */

export default function ProposalCard({
  proposal,
  selected,
  onSelectionChange,
}) {
  const decisionFetcher = useFetcher();
  const executionFetcher = useFetcher();
  const revisionFetcher = useFetcher();
  const revalidator = useRevalidator();
  const revision = proposal.revisions?.[0];
  const decision = proposal.decisions?.[0];
  const execution = proposal.executions?.[0];
  const proposedChanges = revision?.proposedChanges || {};
  const beforeState = revision?.beforeState || {};
  const proposedTitle = proposedChanges.title || "";
  const proposedDescription = proposedChanges.descriptionHtml || "";
  const proposedTags = Array.isArray(proposedChanges.tags)
    ? proposedChanges.tags.join(", ")
    : "";
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(proposedTitle);
  const [editedDescription, setEditedDescription] =
    useState(proposedDescription);
  const [editedTags, setEditedTags] = useState(proposedTags);

  useEffect(() => {
    if (decisionFetcher.state === "idle" && decisionFetcher.data?.proposal) {
      revalidator.revalidate();
    }
  }, [decisionFetcher.data, decisionFetcher.state, revalidator]);

  useEffect(() => {
    if (executionFetcher.state === "idle" && executionFetcher.data?.execution) {
      revalidator.revalidate();
    }
  }, [executionFetcher.data, executionFetcher.state, revalidator]);

  useEffect(() => {
    if (revisionFetcher.state === "idle" && revisionFetcher.data?.revision) {
      setEditing(false);
      revalidator.revalidate();
    }
  }, [revisionFetcher.data, revisionFetcher.state, revalidator]);

  useEffect(() => {
    setEditedTitle(proposedTitle);
    setEditedDescription(proposedDescription);
    setEditedTags(proposedTags);
  }, [
    proposal.id,
    revision?.id,
    proposedDescription,
    proposedTags,
    proposedTitle,
  ]);

  const canReview = proposal.status === "pending";
  const canExecute = proposal.status === "approved";
  const canCancel = proposal.status === "approved";
  const submitDecision = (value) =>
    decisionFetcher.submit(
      { decision: value },
      {
        method: "post",
        action: `/api/proposals/${proposal.id}/decide`,
        encType: "application/json",
      },
    );

  return (
    <article className="workspace-card">
      <div className="workspace-card-heading">
        <div>
          <p className="workspace-label">Listing proposal</p>
          <h2>{proposal.title}</h2>
        </div>
        <Badge tone={proposal.status === "approved" ? "success" : ""}>
          {proposal.status}
        </Badge>
      </div>
      <p className="workspace-muted">{proposal.rationale}</p>
      <div className="workspace-grid-2">
        <div className="workspace-callout">
          <strong>Before</strong>
          <pre className="workspace-code">
            {JSON.stringify(beforeState, null, 2)}
          </pre>
        </div>
        <div className="workspace-callout">
          <strong>Approved after</strong>
          <pre className="workspace-code">
            {JSON.stringify(proposedChanges, null, 2)}
          </pre>
        </div>
      </div>
      {onSelectionChange && canReview && (
        <label className="workspace-choice">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectionChange(event.target.checked)}
          />
          Include in batch approval
        </label>
      )}
      <div className="workspace-callout">
        <strong>Proposal context</strong>
        <pre className="workspace-code">
          {JSON.stringify(
            { productId: proposal.affectedProductId, type: proposal.type },
            null,
            2,
          )}
        </pre>
      </div>
      <p className="workspace-muted">
        Risk: {proposal.risk || "Not specified."} Uncertainty:{" "}
        {proposal.uncertainty || "Not specified."}
      </p>
      <details>
        <summary>View evidence</summary>
        <pre className="workspace-code">
          {JSON.stringify(
            {
              internal: proposal.internalEvidence,
              external: proposal.externalEvidence,
            },
            null,
            2,
          )}
        </pre>
      </details>
      {canReview && (
        <div className="workspace-inline">
          <button
            className="workspace-button secondary"
            type="button"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "Cancel edit" : "Edit proposal"}
          </button>
          <button
            className="workspace-button"
            type="button"
            onClick={() => submitDecision("approved")}
          >
            Approve proposal
          </button>
          <button
            className="workspace-button secondary"
            type="button"
            onClick={() => submitDecision("rejected")}
          >
            Reject
          </button>
        </div>
      )}
      {editing && canReview && (
        <div className="workspace-stack">
          <input
            className="workspace-input"
            aria-label="Proposed title"
            value={editedTitle}
            onChange={(event) => setEditedTitle(event.target.value)}
          />
          <textarea
            className="workspace-textarea"
            aria-label="Proposed description"
            placeholder="Optional replacement description"
            value={editedDescription}
            onChange={(event) => setEditedDescription(event.target.value)}
          />
          <input
            className="workspace-input"
            aria-label="Proposed tags"
            placeholder="Optional comma-separated tags"
            value={editedTags}
            onChange={(event) => setEditedTags(event.target.value)}
          />
          <button
            className="workspace-button"
            type="button"
            onClick={() =>
              revisionFetcher.submit(
                {
                  changes: {
                    ...(editedTitle.trim()
                      ? { title: editedTitle.trim() }
                      : {}),
                    ...(editedDescription.trim()
                      ? { descriptionHtml: editedDescription.trim() }
                      : {}),
                    ...(editedTags.trim()
                      ? {
                          tags: editedTags
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        }
                      : {}),
                  },
                },
                {
                  method: "post",
                  action: `/api/proposals/${proposal.id}/revise`,
                  encType: "application/json",
                },
              )
            }
          >
            Save revision
          </button>
        </div>
      )}
      {canExecute && (
        <div className="workspace-inline">
          <button
            className="workspace-button"
            type="button"
            onClick={() =>
              executionFetcher.submit(
                {},
                {
                  method: "post",
                  action: `/api/proposals/${proposal.id}/execute`,
                  encType: "application/json",
                },
              )
            }
          >
            Apply and verify
          </button>
          {canCancel && (
            <button
              className="workspace-button secondary"
              type="button"
              onClick={() =>
                executionFetcher.submit(
                  {},
                  {
                    method: "post",
                    action: `/api/proposals/${proposal.id}/cancel`,
                    encType: "application/json",
                  },
                )
              }
            >
              Cancel approval
            </button>
          )}
        </div>
      )}
      {decision && (
        <p className="workspace-muted">
          Merchant decision: {decision.decision}
        </p>
      )}
      {execution && (
        <p className="workspace-muted">Execution: {execution.status}</p>
      )}
      {executionFetcher.data?.verification && (
        <p className="workspace-muted">
          Verification:{" "}
          {executionFetcher.data.verification.verified ? "passed" : "failed"}
        </p>
      )}
      {decisionFetcher.data?.error && (
        <p className="workspace-error">{decisionFetcher.data.error}</p>
      )}
      {revisionFetcher.data?.error && (
        <p className="workspace-error">{revisionFetcher.data.error}</p>
      )}
      {executionFetcher.data?.error && (
        <p className="workspace-error">{executionFetcher.data.error}</p>
      )}
    </article>
  );
}

/* eslint-enable react/prop-types */
