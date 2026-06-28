import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  /** Render the eyebrow as a path: monospace, normal-case, truncated. */
  eyebrowAsPath?: boolean;
};

/**
 * The header bar at the top of every section / workbench page. Reuses the
 * fluid `.topbar` layout so its actions wrap by pane width.
 */
export function PageHeader({
  eyebrow,
  title,
  actions,
  eyebrowAsPath,
}: PageHeaderProps) {
  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="topbar-title" data-tauri-drag-region>
        {eyebrowAsPath ? (
          <span className="eyebrow-path truncate" title={eyebrow} data-tauri-drag-region>
            {eyebrow}
          </span>
        ) : (
          <span className="eyebrow" data-tauri-drag-region>
            {eyebrow}
          </span>
        )}
        <h2 data-tauri-drag-region>{title}</h2>
      </div>
      {actions}
    </header>
  );
}
