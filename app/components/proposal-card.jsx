import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Badge } from "./workspace-page";

/* eslint-disable react/prop-types */

export default function ProposalCard({ proposal }) {
  const decisionFetcher = useFetcher();
  const executionFetcher = useFetcher();
  const revisionFetcher = useFetcher();
  const revalidator = useRevalidator();
  const revision = proposal.revisions?.[0];
  const decision = proposal.decisions?.[0];
  const execution = proposal.executions?.[0];
  const proposedChanges = revision?.proposedChanges || {};
  const [editing, setEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(proposedChanges.title || "");

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

  const canReview = proposal.status === "pending";
  const canExecute = proposal.status === "approved";
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
      <div className="workspace-callout">
        <strong>Proposed change</strong>
        <pre className="workspace-code">
          {JSON.stringify(proposedChanges, null, 2)}
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
            {editing ? "Cancel edit" : "Edit title"}
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
        <div className="workspace-inline">
          <input
            className="workspace-input"
            aria-label="Proposed title"
            value={editedTitle}
            onChange={(event) => setEditedTitle(event.target.value)}
          />
          <button
            className="workspace-button"
            type="button"
            onClick={() =>
              revisionFetcher.submit(
                { changes: { title: editedTitle } },
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
          Apply approved change
        </button>
      )}
      {decision && (
        <p className="workspace-muted">
          Merchant decision: {decision.decision}
        </p>
      )}
      {execution && (
        <p className="workspace-muted">Execution: {execution.status}</p>
      )}
    </article>
  );
}

/* eslint-enable react/prop-types */
