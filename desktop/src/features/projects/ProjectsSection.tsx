import { FolderGit2 } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";

/**
 * Projects home. Placeholder for now — the multi-project list, persistence, and
 * per-project workbench land in the following modules (ctx-103 / ctx-104 /
 * ctx-105). This keeps the two-level navigation shell coherent in the meantime.
 */
export function ProjectsSection() {
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Projects" />
      <section className="panel empty-state-panel">
        <FolderGit2 aria-hidden="true" size={26} />
        <h3>Multi-project management is being set up</h3>
        <p className="empty-copy">
          Soon you can add local projects here, see each project's git identity
          status at a glance, and manage it in its own workbench. Reusable
          identities live under Profiles.
        </p>
      </section>
    </>
  );
}
