import { FolderGit2, FolderPlus, GitBranch, Server, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import type { Project, RepositoryStatus } from "../../domain/gitscope";
import { shortPath } from "../../lib/format";

type ProjectsListProps = {
  projects: Project[];
  projectStatuses: Record<string, RepositoryStatus | null>;
  busy: boolean;
  message: string;
  onAddProject: () => void;
  onOpenProject: (project: Project) => void;
  onRemoveProject: (project: Project) => void;
};

export function ProjectsList({
  projects,
  projectStatuses,
  busy,
  message,
  onAddProject,
  onOpenProject,
  onRemoveProject,
}: ProjectsListProps) {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        actions={
          <button
            className="primary-action icon-button"
            disabled={busy}
            onClick={onAddProject}
            type="button"
          >
            <FolderPlus aria-hidden="true" size={17} />
            <span>Add project</span>
          </button>
        }
      />

      {message && <div className="message-bar">{message}</div>}

      {projects.length === 0 ? (
        <section className="panel empty-state-panel">
          <FolderGit2 aria-hidden="true" size={26} />
          <h3>No projects yet</h3>
          <p className="empty-copy">
            Add a local project folder to manage its git identity and context.
            Files are never modified until you review and apply a change.
          </p>
          <button
            className="primary-action icon-button"
            disabled={busy}
            onClick={onAddProject}
            type="button"
          >
            <FolderPlus aria-hidden="true" size={17} />
            <span>Add project</span>
          </button>
        </section>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              scanned={project.id in projectStatuses}
              status={projectStatuses[project.id] ?? null}
              onOpen={() => onOpenProject(project)}
              onRemove={() => onRemoveProject(project)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ProjectCard({
  project,
  scanned,
  status,
  onOpen,
  onRemove,
}: {
  project: Project;
  scanned: boolean;
  status: RepositoryStatus | null;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const isRepo = Boolean(status);
  const branchLabel = !scanned
    ? "Scanning…"
    : isRepo
      ? (status?.repository.currentBranch ?? "No branch")
      : "Not a git repository";

  return (
    <article className="panel project-card">
      <button className="project-card-open" onClick={onOpen} type="button">
        <div className="project-card-head">
          <FolderGit2 aria-hidden="true" size={18} />
          <div>
            <h3>{project.name}</h3>
            <p className="truncate" title={project.path}>
              {shortPath(project.path)}
            </p>
          </div>
        </div>
        <dl className="project-card-meta">
          <div>
            <GitBranch aria-hidden="true" size={14} />
            <span>{branchLabel}</span>
          </div>
          {isRepo && (
            <div>
              <Server aria-hidden="true" size={14} />
              <span>{status?.repository.remote?.host ?? "No remote"}</span>
            </div>
          )}
        </dl>
      </button>

      <div className="project-card-footer">
        <StatusBadge
          status={!scanned ? "warning" : isRepo ? "passed" : "warning"}
          label={!scanned ? "Scanning" : isRepo ? "Git ready" : "No repo"}
        />
        <button
          className="danger-action icon-only-button"
          onClick={onRemove}
          title="Remove project"
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} />
        </button>
      </div>
    </article>
  );
}
