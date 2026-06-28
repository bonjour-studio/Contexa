import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import type {
  ApplyHistoryItem,
  ApplyPlan,
  ConnectionTestResult,
  GitIdentityProfile,
  PreflightResult,
  Project,
  RepositoryStatus,
} from "../../domain/gitscope";
import { shortPath } from "../../lib/format";
import { GitIdentityPanel } from "./GitIdentityPanel";
import { ProjectOverview, type IdentityState } from "./ProjectOverview";

type WorkbenchTab = "overview" | "identity";

type ProjectWorkbenchProps = {
  project: Project;
  status: RepositoryStatus | null;
  profiles: GitIdentityProfile[];
  linkedProfile: GitIdentityProfile | null;
  identityState: IdentityState;
  history: ApplyHistoryItem[];
  applyPlan: ApplyPlan | null;
  preflight: PreflightResult | null;
  connectionResult: ConnectionTestResult | null;
  busy: boolean;
  message: string;
  onBack: () => void;
  onLinkProfile: (profileId: string | null) => void;
  onApply: () => void;
  onTestSsh: () => void;
  onTestRemote: () => void;
};

const tabs: Array<{ id: WorkbenchTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "identity", label: "Git Identity" },
];

/**
 * The open project's workbench. Two tabs: Overview (status, drift, profile
 * linking, history) and Git Identity (preflight, diff, apply, connection tests).
 */
export function ProjectWorkbench({
  project,
  status,
  profiles,
  linkedProfile,
  identityState,
  history,
  applyPlan,
  preflight,
  connectionResult,
  busy,
  message,
  onBack,
  onLinkProfile,
  onApply,
  onTestSsh,
  onTestRemote,
}: ProjectWorkbenchProps) {
  const [tab, setTab] = useState<WorkbenchTab>("overview");

  return (
    <div className="page">
      <PageHeader
        eyebrow={shortPath(project.path)}
        eyebrowAsPath
        title={project.name}
        actions={
          <button className="icon-button" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={15} />
            <span>All projects</span>
          </button>
        }
      />

      <div className="workbench-tabs" role="tablist" aria-label="Project workbench">
        {tabs.map((item) => (
          <button
            aria-selected={tab === item.id}
            className={tab === item.id ? "workbench-tab active" : "workbench-tab"}
            key={item.id}
            onClick={() => setTab(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <div className="message-bar">{message}</div>}

      {tab === "overview" ? (
        <ProjectOverview
          status={status}
          profiles={profiles}
          linkedProfile={linkedProfile}
          identityState={identityState}
          history={history}
          busy={busy}
          onLinkProfile={onLinkProfile}
        />
      ) : (
        <GitIdentityPanel
          status={status}
          linkedProfile={linkedProfile}
          applyPlan={applyPlan}
          preflight={preflight}
          connectionResult={connectionResult}
          busy={busy}
          onApply={onApply}
          onTestSsh={onTestSsh}
          onTestRemote={onTestRemote}
          onGoToOverview={() => setTab("overview")}
        />
      )}
    </div>
  );
}
