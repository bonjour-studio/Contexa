import type { Project, RepositoryStatus } from "../../domain/gitscope";
import { ProjectsList } from "./ProjectsList";
import { ProjectWorkbench } from "./ProjectWorkbench";

type ProjectsSectionProps = {
  projects: Project[];
  projectStatuses: Record<string, RepositoryStatus | null>;
  openProject: Project | null;
  openProjectStatus: RepositoryStatus | null;
  busy: boolean;
  message: string;
  onAddProject: () => void;
  onOpenProject: (project: Project) => void;
  onRemoveProject: (project: Project) => void;
  onCloseProject: () => void;
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
  busy,
  message,
  onAddProject,
  onOpenProject,
  onRemoveProject,
  onCloseProject,
}: ProjectsSectionProps) {
  if (openProject) {
    return (
      <ProjectWorkbench
        project={openProject}
        status={openProjectStatus}
        message={message}
        onBack={onCloseProject}
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
