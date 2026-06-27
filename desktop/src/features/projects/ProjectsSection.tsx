import type {
  ApplyHistoryItem,
  ApplyPlan,
  ConnectionTestResult,
  GitIdentityProfile,
  PreflightResult,
  Project,
  RepositoryStatus,
} from "../../domain/gitscope";
import { ProjectsList } from "./ProjectsList";
import { ProjectWorkbench } from "./ProjectWorkbench";
import type { IdentityState } from "./ProjectOverview";

type ProjectsSectionProps = {
  projects: Project[];
  projectStatuses: Record<string, RepositoryStatus | null>;
  openProject: Project | null;
  openProjectStatus: RepositoryStatus | null;
  profiles: GitIdentityProfile[];
  linkedProfile: GitIdentityProfile | null;
  identityState: IdentityState;
  projectHistory: ApplyHistoryItem[];
  applyPlan: ApplyPlan | null;
  preflight: PreflightResult | null;
  connectionResult: ConnectionTestResult | null;
  busy: boolean;
  message: string;
  onAddProject: () => void;
  onOpenProject: (project: Project) => void;
  onRemoveProject: (project: Project) => void;
  onCloseProject: () => void;
  onLinkProfile: (profileId: string | null) => void;
  onApply: () => void;
  onTestSsh: () => void;
  onTestRemote: () => void;
};

/**
 * Routes the Projects section between the multi-project list and the open
 * project's workbench. The open project (if any) is the source of truth.
 */
export function ProjectsSection({
  projects,
  projectStatuses,
  openProject,
  openProjectStatus,
  profiles,
  linkedProfile,
  identityState,
  projectHistory,
  applyPlan,
  preflight,
  connectionResult,
  busy,
  message,
  onAddProject,
  onOpenProject,
  onRemoveProject,
  onCloseProject,
  onLinkProfile,
  onApply,
  onTestSsh,
  onTestRemote,
}: ProjectsSectionProps) {
  if (openProject) {
    return (
      <ProjectWorkbench
        key={openProject.id}
        project={openProject}
        status={openProjectStatus}
        profiles={profiles}
        linkedProfile={linkedProfile}
        identityState={identityState}
        history={projectHistory}
        applyPlan={applyPlan}
        preflight={preflight}
        connectionResult={connectionResult}
        busy={busy}
        message={message}
        onBack={onCloseProject}
        onLinkProfile={onLinkProfile}
        onApply={onApply}
        onTestSsh={onTestSsh}
        onTestRemote={onTestRemote}
      />
    );
  }

  return (
    <ProjectsList
      projects={projects}
      projectStatuses={projectStatuses}
      busy={busy}
      message={message}
      onAddProject={onAddProject}
      onOpenProject={onOpenProject}
      onRemoveProject={onRemoveProject}
    />
  );
}
