/* eslint-disable react/prop-types */

export function WorkspacePage({
  eyebrow,
  title,
  description,
  actions,
  children,
}) {
  return (
    <main className="workspace-page">
      <div className="workspace-container">
        <header className="workspace-header">
          <div>
            <p className="workspace-eyebrow">
              {eyebrow || "MerchRelay workspace"}
            </p>
            <h1 className="workspace-title">{title}</h1>
            {description && (
              <p className="workspace-description">{description}</p>
            )}
          </div>
          {actions && <div className="workspace-header-actions">{actions}</div>}
        </header>
        {children}
      </div>
    </main>
  );
}

export function Card({ title, detail, children }) {
  return (
    <section className="workspace-card">
      {(title || detail) && (
        <div className="workspace-card-heading">
          <h2>{title}</h2>
          {detail && <span className="workspace-muted">{detail}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "" }) {
  return <span className={`workspace-badge ${tone}`}>{children}</span>;
}

/* eslint-enable react/prop-types */
