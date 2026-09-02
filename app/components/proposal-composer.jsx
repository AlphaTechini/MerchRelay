import { useEffect, useState } from "react";
import { useFetcher, useNavigate, useRevalidator } from "react-router";

/* eslint-disable react/prop-types */

export default function ProposalComposer({ products, recommendedResearch }) {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [proposalTitle, setProposalTitle] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [tags, setTags] = useState("");
  const [rationale, setRationale] = useState("");
  const [researchNote, setResearchNote] = useState("");

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.proposal) {
      setProposalTitle("");
      setListingTitle("");
      setDescriptionHtml("");
      setTags("");
      setRationale("");
      setResearchNote("");
      revalidator.revalidate();
      navigate("/app/proposals");
    }
  }, [fetcher.data, fetcher.state, navigate, revalidator]);

  if (products.length === 0) {
    return (
      <div className="workspace-empty">
        Create a draft product in Shopify before creating a safe first proposal.
      </div>
    );
  }

  const submit = () => {
    const changes = {
      ...(listingTitle.trim() ? { title: listingTitle.trim() } : {}),
      ...(descriptionHtml.trim()
        ? { descriptionHtml: descriptionHtml.trim() }
        : {}),
      ...(tags.trim()
        ? {
            tags: tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          }
        : {}),
    };

    fetcher.submit(
      {
        goal: `Review ${recommendedResearch.category}.`,
        productId,
        changes,
        title: proposalTitle.trim() || undefined,
        rationale:
          rationale.trim() ||
          `Review this draft listing in the context of ${recommendedResearch.category}.`,
        internalEvidence: {
          selectedCategory: recommendedResearch.category,
          selectionReason: recommendedResearch.reason,
        },
        ...(researchNote.trim()
          ? {
              externalEvidence: {
                source: "merchant_entered_research_note",
                note: researchNote.trim(),
              },
            }
          : {}),
        risk: "This changes one draft product only after merchant approval.",
        uncertainty:
          "The merchant must verify brand fit and public research before approval.",
      },
      {
        method: "post",
        action: "/api/proposals",
        encType: "application/json",
      },
    );
  };

  return (
    <div className="workspace-stack">
      <p className="workspace-muted">
        This creates a pending proposal. It cannot update Shopify until the
        merchant approves the exact revision.
      </p>
      <label>
        Draft product
        <select
          className="workspace-input"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Proposal title
        <input
          className="workspace-input"
          placeholder="Improve draft listing"
          value={proposalTitle}
          onChange={(event) => setProposalTitle(event.target.value)}
        />
      </label>
      <label>
        Proposed listing title
        <input
          className="workspace-input"
          placeholder="At least one proposed change is required"
          value={listingTitle}
          onChange={(event) => setListingTitle(event.target.value)}
        />
      </label>
      <label>
        Proposed description
        <textarea
          className="workspace-textarea"
          placeholder="Optional replacement product description"
          value={descriptionHtml}
          onChange={(event) => setDescriptionHtml(event.target.value)}
        />
      </label>
      <label>
        Proposed tags
        <input
          className="workspace-input"
          placeholder="Optional, comma-separated tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
        />
      </label>
      <label>
        Merchant rationale
        <textarea
          className="workspace-textarea"
          placeholder="Why is this an appropriate change?"
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
        />
      </label>
      <label>
        Public research note
        <textarea
          className="workspace-textarea"
          placeholder="Optional. Record a public comparison or market pattern before proposing."
          value={researchNote}
          onChange={(event) => setResearchNote(event.target.value)}
        />
      </label>
      <button
        className="workspace-button"
        type="button"
        disabled={
          fetcher.state !== "idle" ||
          (!listingTitle.trim() && !descriptionHtml.trim() && !tags.trim())
        }
        onClick={submit}
      >
        {fetcher.state === "submitting"
          ? "Creating proposal..."
          : "Create proposal"}
      </button>
      {fetcher.data?.error && (
        <p className="workspace-error">{fetcher.data.error}</p>
      )}
    </div>
  );
}

/* eslint-enable react/prop-types */
