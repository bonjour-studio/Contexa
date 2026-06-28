import { FolderGit2, FolderPlus, GitBranch, Server, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { PathText } from "../../components/PathText";
import { StatusBadge } from "../../components/StatusBadge";
import type { Project, RepositoryStatus } from "../../domain/gitscope";

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
    <div className="page">
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
            <FolderPlus aria-hidden="true" size={15} />
            <span>Add project</span>
          </button>
        }
      />

      {message && <div className="message-bar">{message}</div>}

      {projects.length === 0 ? (
        <section className="group">
          <div className="empty-block">
            <FolderGit2 aria-hidden="true" size={24} />
            <h3>No projects yet</h3>
            <p className="empty-copy">
              Add a local project folder to manage its git identity. Files are
              never modified until you review and apply a change.
            </p>
            <button
              className="primary-action icon-button"
              disabled={busy}
              onClick={onAddProject}
              type="button"
            >
              <FolderPlus aria-hidden="true" size={15} />
              <span>Add project</span>
            </button>
          </div>
        </section>
      ) : (
        <div className="group">
          {projects.map((project) => (
            <ProjectRow
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
    </div>
  );
}

function ProjectRow({
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
      : "Not a repo";
  const host = status?.repository.remote?.host;

  return (
    <div className="list-row">
      <button className="row-open" onClick={onOpen} type="button">
        <FolderGit2 className="row-lead" aria-hidden="true" size={16} />
        <span className="row-title">{project.name}</span>
        <PathText className="row-sub" value={project.path} tilde />
      </button>

      <div className="row-trailing">
        {isRepo && (
          <div className="row-meta">
            <span>
              <GitBranch aria-hidden="true" size={13} />
              {branchLabel}
            </span>
            {host && (
              <span>
                <Server aria-hidden="true" size={13} />
                {host}
              </span>
            )}
          </div>
        )}
        <div className="row-actions">
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
            <Trash2 aria-hidden="true" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
