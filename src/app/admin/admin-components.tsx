import type { ReactNode } from "react";
import { Search } from "lucide-react";

export function AdminPage({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AdminCard({ title, description, actions, children }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="admin-card">
      {title || description || actions ? (
        <div className="admin-card-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="admin-card-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function AdminBadge({ tone = "neutral", children }: { tone?: "success" | "warning" | "critical" | "info" | "neutral"; children: ReactNode }) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>;
}

export function AdminEmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="admin-empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function AdminFilters({ children }: { children: ReactNode }) {
  return <div className="admin-filters">{children}</div>;
}

export function AdminSearchInput({ name = "q", defaultValue, placeholder }: { name?: string; defaultValue?: string; placeholder: string }) {
  return (
    <label className="admin-search-field">
      <Search size={17} />
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}

export function AdminIndexTable({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`admin-index-table ${className}`.trim()}>{children}</div>;
}

export function AdminSaveBar({ children }: { children: ReactNode }) {
  return <div className="admin-save-bar">{children}</div>;
}
