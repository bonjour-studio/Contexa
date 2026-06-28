import {
  FolderGit2,
  FolderOpen,
  FolderPlus,
  GitBranch,
  Server,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ContextMenu } from "../../components/ContextMenu";
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

type MenuState = { project: Project; x: number; y: number };

export function ProjectsList({
  projects,
  projectStatuses,
  busy,
  message,
  onAddProject,
  onOpenProject,
  onRemoveProject,
}: ProjectsListProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);

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
              onContextMenu={(x, y) => setMenu({ project, x, y })}
            />
          ))}
        </div>
      )}

      {menu && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <button
            className="context-menu-item"
            type="button"
            onClick={() => {
              onOpenProject(menu.project);
              setMenu(null);
            }}
          >
            <FolderOpen aria-hidden="true" size={15} />
            <span>Open</span>
          </button>
          <div className="context-menu-separator" />
          <button
            className="context-menu-item danger"
            type="button"
            onClick={() => {
              onRemoveProject(menu.project);
              setMenu(null);
            }}
          >
            <Trash2 aria-hidden="true" size={15} />
            <span>Remove project</span>
          </button>
        </ContextMenu>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  scanned,
  status,
  onOpen,
  onContextMenu,
}: {
  project: Project;
  scanned: boolean;
  status: RepositoryStatus | null;
  onOpen: () => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  const isRepo = Boolean(status);
  const branchLabel = !scanned
    ? "Scanning…"
    : isRepo
      ? (status?.repository.currentBranch ?? "No branch")
      : "Not a repo";
  const host = status?.repository.remote?.host;

  return (
    <div
      className="list-row"
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(event.clientX, event.clientY);
      }}
    >
      <button className="row-open" onClick={onOpen} type="button">
        <FolderGit2 className="row-lead" aria-hidden="true" size={16} />
        <span className="row-title">{project.name}</span>
        <PathText className="row-sub" value={project.path} tilde />
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
        <StatusBadge
          status={!scanned ? "warning" : isRepo ? "passed" : "warning"}
          label={!scanned ? "Scanning" : isRepo ? "Git ready" : "No repo"}
        />
      </button>
    </div>
  );
}
