import { useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import ProposalCard from "./proposal-card";

/* eslint-disable react/prop-types */

export default function ProposalQueue({ proposals }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const batchFetcher = useFetcher();
  const revalidator = useRevalidator();
  const pendingIds = proposals
    .filter((proposal) => proposal.status === "pending")
    .map((proposal) => proposal.id);

  useEffect(() => {
    if (batchFetcher.state === "idle" && batchFetcher.data?.result) {
      setSelectedIds([]);
      revalidator.revalidate();
    }
  }, [batchFetcher.data, batchFetcher.state, revalidator]);

  const setSelected = (proposalId, isSelected) => {
    setSelectedIds((current) =>
      isSelected
        ? [...new Set([...current, proposalId])]
        : current.filter((id) => id !== proposalId),
    );
  };

  return (
    <div className="workspace-stack">
      {pendingIds.length > 1 && (
        <div className="workspace-inline">
          <button
            className="workspace-button secondary"
            type="button"
            onClick={() => setSelectedIds(pendingIds)}
          >
            Select all pending
          </button>
          <button
            className="workspace-button"
            type="button"
            disabled={selectedIds.length === 0 || batchFetcher.state !== "idle"}
            onClick={() =>
              batchFetcher.submit(
                { proposalIds: selectedIds },
                {
                  method: "post",
                  action: "/api/proposals/batch-decide",
                  encType: "application/json",
                },
              )
            }
          >
            {batchFetcher.state === "submitting"
              ? "Approving..."
              : `Approve selected (${selectedIds.length})`}
          </button>
        </div>
      )}
      {batchFetcher.data?.error && (
        <p className="workspace-error">{batchFetcher.data.error}</p>
      )}
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          selected={selectedIds.includes(proposal.id)}
          onSelectionChange={
            proposal.status === "pending"
              ? (isSelected) => setSelected(proposal.id, isSelected)
              : undefined
          }
        />
      ))}
    </div>
  );
}

/* eslint-enable react/prop-types */
