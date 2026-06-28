import { FolderGit2, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";

export type AppSection = "projects" | "profiles" | "settings";

const navItems = [
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] satisfies Array<{
  id: AppSection;
  label: string;
  icon: typeof FolderGit2;
}>;

type AppShellProps = {
  section: AppSection;
  children: ReactNode;
  onSectionChange: (section: AppSection) => void;
};

/**
 * Top-level shell: a fixed sidebar with the three project-independent sections
 * (Projects / Profiles / Settings) and a scrolling content pane. Per-project
 * navigation (Overview / Git Identity) lives inside the Projects workbench, not
 * here — this is the outer level of the two-level navigation.
 */
export function AppShell({ section, children, onSectionChange }: AppShellProps) {
  return (
    <main className="app-shell">
      <aside className="sidebar" data-tauri-drag-region>
        <div className="brand-block" data-tauri-drag-region>
          <span className="brand-mark">Cx</span>
          <div>
            <h1>Contexa</h1>
            <p>Context console</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Contexa sections">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                aria-current={section === item.id ? "page" : undefined}
                className={section === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="sidebar-panel">
          <span className="eyebrow">Local-first</span>
          <strong>No secrets stored</strong>
          <p>References only · diff before apply</p>
        </section>
      </aside>

      <section className="workspace">{children}</section>
    </main>
  );
}
