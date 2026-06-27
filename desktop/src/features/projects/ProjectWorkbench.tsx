import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import type {
  ApplyHistoryItem,
  GitIdentityProfile,
  Project,
  RepositoryStatus,
} from "../../domain/gitscope";
import { shortPath } from "../../lib/format";
import { ProjectOverview, type IdentityState } from "./ProjectOverview";

type ProjectWorkbenchProps = {
  project: Project;
  status: RepositoryStatus | null;
  profiles: GitIdentityProfile[];
  linkedProfile: GitIdentityProfile | null;
  identityState: IdentityState;
  history: ApplyHistoryItem[];
  busy: boolean;
  message: string;
  onBack: () => void;
  onLinkProfile: (profileId: string | null) => void;
};

/**
 * The open project's workbench. Shows the project Overview — status, local git
 * config drift against the linked profile, profile linking, and this project's
 * apply history. The Git Identity apply flow is added as a second tab next.
 */
export function ProjectWorkbench({
  project,
  status,
  profiles,
  linkedProfile,
  identityState,
  history,
  busy,
  message,
  onBack,
  onLinkProfile,
}: ProjectWorkbenchProps) {
  return (
    <>
      <PageHeader
        eyebrow={shortPath(project.path)}
        title={project.name}
        actions={
          <button className="icon-button" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={17} />
            <span>All projects</span>
          </button>
        }
      />

      {message && <div className="message-bar">{message}</div>}

      <ProjectOverview
        status={status}
        profiles={profiles}
        linkedProfile={linkedProfile}
        identityState={identityState}
        history={history}
        busy={busy}
        onLinkProfile={onLinkProfile}
      />
    </>
  );
}
