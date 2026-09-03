import { useEffect, useRef, useState } from "react";

/* eslint-disable react/prop-types */

function textValue(value) {
  if (value === null || value === undefined) return "Not provided";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  return JSON.stringify(value, null, 2);
}

export default function CatalogResult({ product }) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeButton.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        className="workspace-catalog-result"
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span>
          <strong>{product.title}</strong>
          <small>{product.seller?.name || "Seller not provided"}</small>
          <small>Price: {product.priceDisplay || "Not provided"}</small>
          {product.ratingDisplay && (
            <small>Rating: {product.ratingDisplay}</small>
          )}
        </span>
        <span className="workspace-catalog-result-action">View details</span>
      </button>
      {open && (
        <div
          className="workspace-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="workspace-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`catalog-title-${product.id}`}
          >
            <div className="workspace-modal-header">
              <div>
                <p className="workspace-label">Catalog result</p>
                <h2 id={`catalog-title-${product.id}`}>{product.title}</h2>
              </div>
              <button
                className="workspace-button secondary"
                type="button"
                ref={closeButton}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            {product.imageUrl && (
              <img
                className="workspace-catalog-image"
                src={product.imageUrl}
                alt={product.imageAlt || product.title}
              />
            )}
            <div className="workspace-catalog-details">
              <div>
                <strong>Seller</strong>
                <span>
                  {product.seller?.name || "Not provided"}
                  {product.seller?.domain ? ` (${product.seller.domain})` : ""}
                </span>
              </div>
              {product.seller && typeof product.seller === "object" && (
                <div className="workspace-catalog-description">
                  <strong>Seller details</strong>
                  <pre className="workspace-code">
                    {textValue(product.seller)}
                  </pre>
                </div>
              )}
              <div>
                <strong>Price</strong>
                <span>
                  {product.priceDisplay || textValue(product.priceRange)}
                </span>
              </div>
              <div>
                <strong>Rating</strong>
                <span>{product.ratingDisplay || "Not provided"}</span>
              </div>
              <div>
                <strong>Availability</strong>
                <span>{product.availabilityDisplay || "Not provided"}</span>
              </div>
              <div className="workspace-catalog-description">
                <strong>Description</strong>
                <p>{product.descriptionText || "No description provided."}</p>
              </div>
              {product.availability && (
                <div className="workspace-catalog-description">
                  <strong>Availability data</strong>
                  <pre className="workspace-code">
                    {textValue(product.availability)}
                  </pre>
                </div>
              )}
            </div>
            {product.url && (
              <a
                className="workspace-button"
                href={product.url}
                target="_blank"
                rel="noreferrer"
              >
                Open listing
              </a>
            )}
          </section>
        </div>
      )}
    </>
  );
}

/* eslint-enable react/prop-types */
