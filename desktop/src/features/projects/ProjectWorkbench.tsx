import { ArrowLeft, GitBranch, Mail, Server, User } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "../../components/PageHeader";
import { StatusBadge } from "../../components/StatusBadge";
import type { Project, RepositoryStatus } from "../../domain/gitscope";
import { shortPath } from "../../lib/format";

type ProjectWorkbenchProps = {
  project: Project;
  status: RepositoryStatus | null;
  message: string;
  onBack: () => void;
};

/**
 * The open project's workbench. For now it shows the repository summary and a
 * Back action; the rich Overview (metrics, linked profile, drift) and the Git
 * Identity apply flow are layered on in the following modules.
 */
export function ProjectWorkbench({
  project,
  status,
  message,
  onBack,
}: ProjectWorkbenchProps) {
  return (
    <>
      <PageHeader
        eyebrow="Project"
        title={project.name}
        actions={
          <button className="icon-button" onClick={onBack} type="button">
            <ArrowLeft aria-hidden="true" size={17} />
            <span>All projects</span>
          </button>
        }
      />

      {message && <div className="message-bar">{message}</div>}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Repository</span>
            <h3>{shortPath(project.path)}</h3>
          </div>
          <StatusBadge
            status={status ? "passed" : "warning"}
            label={status ? "Git repository" : "No repo"}
          />
        </div>

        {status ? (
          <dl className="identity-grid">
            <DetailItem icon={GitBranch} label="Branch">
              {status.repository.currentBranch ?? "No branch"}
            </DetailItem>
            <DetailItem icon={Server} label="Remote">
              {status.repository.remote?.host ?? "No remote"}
            </DetailItem>
            <DetailItem icon={User} label="user.name">
              {status.config.userName ?? "Unset"}
            </DetailItem>
            <DetailItem icon={Mail} label="user.email">
              {status.config.userEmail ?? "Unset"}
            </DetailItem>
          </dl>
        ) : (
          <p className="empty-copy">
            This folder isn't a git repository, or git could not read it. The
            Overview and Git Identity tools appear here once it's a repo.
          </p>
        )}
      </section>

      <section className="panel">
        <p className="empty-copy">
          Overview metrics, a linked profile with drift detection, and the Git
          Identity apply flow arrive in the next updates.
        </p>
      </section>
    </>
  );
}

function DetailItem({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode;
  icon: typeof User;
  label: string;
}) {
  return (
    <div className="detail-item">
      <Icon aria-hidden="true" size={16} />
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
