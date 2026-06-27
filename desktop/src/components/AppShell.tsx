import {
  Activity,
  ClipboardCheck,
  FolderOpen,
  GitBranch,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  GitIdentityProfile,
  RepositoryStatus,
  WorkspaceTab,
} from "../domain/gitscope";
import { shortPath } from "../lib/format";

const navItems = [
  { id: "overview", label: "Status", icon: Activity },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "review", label: "Review", icon: ClipboardCheck },
] satisfies Array<{
  id: WorkspaceTab;
  label: string;
  icon: typeof Activity;
}>;

type AppShellProps = {
  busy: boolean;
  children: ReactNode;
  message: string;
  profiles: GitIdentityProfile[];
  repoPath: string;
  selectedProfileId: string;
  status: RepositoryStatus | null;
  tab: WorkspaceTab;
  onChooseRepositoryDirectory: () => void;
  onSelectedProfileChange: (profileId: string) => void;
  onTabChange: (tab: WorkspaceTab) => void;
};

export function AppShell({
  busy,
  children,
  message,
  profiles,
  repoPath,
  selectedProfileId,
  status,
  tab,
  onChooseRepositoryDirectory,
  onSelectedProfileChange,
  onTabChange,
}: AppShellProps) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">Cx</span>
          <div>
            <h1>Contexa</h1>
            <p>Identity workspace</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Contexa workspace">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={tab === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => onTabChange(item.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="sidebar-panel">
          <span className="eyebrow">Current Repo</span>
          <strong>{status ? shortPath(status.repository.rootPath) : "Not detected"}</strong>
          <p>
            <GitBranch aria-hidden="true" size={14} />
            {status?.repository.currentBranch ?? "No branch selected"}
          </p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <span className="eyebrow">Workbench</span>
            <h2>Repository identity</h2>
          </div>

          <div className="repo-path-control">
            <label htmlFor="repo-path">Repository path</label>
            <div className="inline-control">
              <input
                id="repo-path"
                readOnly
                value={repoPath}
                placeholder="Choose a repository folder"
              />
              <button
                className="icon-button"
                disabled={busy}
                onClick={onChooseRepositoryDirectory}
                title="Choose repository folder"
                type="button"
              >
                {busy ? (
                  <RefreshCw aria-hidden="true" className="spin-icon" size={17} />
                ) : (
                  <FolderOpen aria-hidden="true" size={17} />
                )}
                <span>Choose</span>
              </button>
            </div>
          </div>

          <div className="profile-picker">
            <label htmlFor="profile-select">Profile</label>
            <div className="select-shell">
              <Settings aria-hidden="true" size={16} />
              <select
                id="profile-select"
                value={selectedProfileId}
                onChange={(event) =>
                  onSelectedProfileChange(event.currentTarget.value)
                }
              >
                <option value="">Select profile</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {message && <div className="message-bar">{message}</div>}

        {children}
      </section>
    </main>
  );
}
