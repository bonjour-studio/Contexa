import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
};

/**
 * The header bar at the top of every section / workbench page. Reuses the
 * fluid `.topbar` layout so its actions wrap by pane width.
 */
export function PageHeader({ eyebrow, title, actions }: PageHeaderProps) {
  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="topbar-title" data-tauri-drag-region>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {actions}
    </header>
  );
}
